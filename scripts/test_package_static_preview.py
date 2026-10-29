import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import tempfile
import unittest
from unittest.mock import patch
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location('packager', Path(__file__).with_name('package-static-preview.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PreviewArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.source.mkdir()
        self.manifest = self.root / 'manifest.json'
        self.output = self.root / 'preview.zip'
        self.rows = []
        for name in ['index.html', '.htaccess', 'services/test/index.html']:
            path = self.source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'synthetic')
            self.rows.append({'path': name, 'bytes': 9, 'sha256': hashlib.sha256(b'synthetic').hexdigest()})

    def run_package(self):
        self.manifest.write_text(json.dumps({'schemaVersion': 1, 'mode': 'preview', 'files': self.rows}))
        return module.package(self.source, self.manifest, self.output)

    def replace_artifact(self, name, body):
        (self.source / name).write_bytes(body)
        for row in self.rows:
            if row['path'] == name:
                row['bytes'] = len(body)
                row['sha256'] = hashlib.sha256(body).hexdigest()

    def assert_nothing_published(self):
        self.assertFalse(self.output.exists())
        self.assertEqual(list(self.root.glob('*.tmp')), [])

    def test_reserved_fixture_attribute_refused_regardless_of_value_or_case(self):
        for attribute in [
            b'data-testimonials-fixture="true"',
            b'data-testimonials-fixture="false"',
            b'data-testimonials-fixture',
            b'data-testimonials-fixture=""',
            b'DATA-TESTIMONIALS-FIXTURE="1"',
            b'Data-Testimonials-Fixture="no"',
        ]:
            with self.subTest(attribute=attribute):
                self.replace_artifact('index.html', b'<!doctype html><html><body><main ' + attribute + b'><h1>Synthetic</h1></main></body></html>')
                with self.assertRaisesRegex(ValueError, 'Reserved data-testimonials-fixture attribute on <main>'):
                    self.run_package()
                self.assert_nothing_published()

    def test_reserved_fixture_attribute_refused_in_nested_route_and_self_closing_tag(self):
        self.replace_artifact('services/test/index.html', b'<html><body><main><img src="/x.png" alt="" data-testimonials-fixture /></main></body></html>')
        with self.assertRaisesRegex(ValueError, r'attribute on <img> in services/test/index\.html'):
            self.run_package()
        self.assert_nothing_published()

    def test_reserved_fixture_marker_as_text_or_script_string_is_not_refused(self):
        self.replace_artifact('index.html', b'<!doctype html><html><body><main>'
                              b'<p>The string data-testimonials-fixture="true" is only text here.</p>'
                              b'<!-- data-testimonials-fixture="true" in a comment -->'
                              b'<script>const marker = "data-testimonials-fixture"; const other = \'data-testimonials-fixture="true"\';</script>'
                              b'</main></body></html>')
        self.replace_artifact('.htaccess', b'# data-testimonials-fixture mentioned in routing config text')
        result = self.run_package()
        self.assertEqual(result['files'], 3)
        self.assertTrue(self.output.exists())

    def test_reserved_fixture_attribute_helper_uses_parsed_tags_only(self):
        self.assertEqual(module.reserved_fixture_elements(b'<div data-testimonials-fixture="true"></div>'), ['div'])
        self.assertEqual(module.reserved_fixture_elements(b'<DIV DATA-TESTIMONIALS-FIXTURE></DIV>'), ['div'])
        self.assertEqual(module.reserved_fixture_elements(b'<p>data-testimonials-fixture="true"</p>'), [])
        self.assertEqual(module.reserved_fixture_elements(b'<script>"<div data-testimonials-fixture>"</script>'), [])
        self.assertEqual(module.reserved_fixture_elements(b'<div data-testimonials-fixtures="true"></div>'), [])

    def test_explicit_modes_and_content(self):
        result = self.run_package()
        self.assertEqual((result['files'], result['directories']), (3, 2))
        with ZipFile(self.output) as archive:
            for item in archive.infolist():
                self.assertEqual(item.create_system, 3)
                self.assertEqual(stat.S_IMODE(item.external_attr >> 16), 0o755 if item.is_dir() else 0o644)
                if not item.is_dir():
                    self.assertEqual(archive.read(item), b'synthetic')

    def test_changed_input_refused_before_output(self):
        (self.source / 'index.html').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'differs from manifest'):
            self.run_package()
        self.assertFalse(self.output.exists())

    def test_traversal_refused(self):
        self.rows[0]['path'] = '../index.html'
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            self.run_package()

    def test_existing_archive_preserved(self):
        self.output.write_bytes(b'preserve')
        with self.assertRaises(FileExistsError):
            self.run_package()
        self.assertEqual(self.output.read_bytes(), b'preserve')

    def test_root_link_refused_before_resolution(self):
        with patch.object(Path, 'is_symlink', return_value=True):
            with self.assertRaisesRegex(ValueError, 'Source root must not be a link'):
                self.run_package()
        self.assertFalse(self.output.exists())

    def test_failed_write_never_publishes_final_archive(self):
        original = ZipFile.writestr
        written = 0
        def fail_mid_write(archive, *args, **kwargs):
            nonlocal written
            written += 1
            if written == 2:
                raise OSError('Synthetic disk failure')
            return original(archive, *args, **kwargs)
        with patch.object(ZipFile, 'writestr', fail_mid_write):
            with self.assertRaisesRegex(OSError, 'Synthetic disk failure'):
                self.run_package()
        self.assertFalse(self.output.exists())
        self.assertEqual(list(self.root.glob('*.tmp')), [])


class ProductionArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / 'source'
        self.manifest = self.root / 'manifest.json'
        self.output = self.root / 'production.zip'
        self.rows = []
        self.write('index.html', b'<!doctype html><title>Home</title>')
        self.write('.htaccess', (module.PRODUCTION_ENDPOINT_RULE + '\n').encode())
        self.write(module.PRODUCTION_ENDPOINT, b'<?php // synthetic')

    def write(self, name, body):
        path = self.source / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)
        self.rows = [row for row in self.rows if row['path'] != name]
        self.rows.append({'path': name, 'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()})

    def run_package(self, mode='production', manifest_mode='production', preserved=None):
        self.manifest.write_text(json.dumps({'schemaVersion': 1, 'mode': manifest_mode, 'files': self.rows, 'preservedFiles': preserved or []}))
        return module.package(self.source, self.manifest, self.output, mode)

    def test_packages_endpoint_at_rewrite_path(self):
        result = self.run_package()
        self.assertEqual(result['files'], 3)
        with ZipFile(self.output) as archive:
            self.assertEqual(archive.read(module.PRODUCTION_ENDPOINT), b'<?php // synthetic')

    def test_update_preserves_existing_email_handler(self):
        self.rows = [row for row in self.rows if row['path'] != module.PRODUCTION_ENDPOINT]
        self.run_package(preserved=[module.PRODUCTION_ENDPOINT])
        with ZipFile(self.output) as archive:
            self.assertNotIn(module.PRODUCTION_ENDPOINT, archive.namelist())
            self.assertIn(module.PRODUCTION_ENDPOINT_RULE.encode(), archive.read('.htaccess'))

    def test_preservation_cannot_hide_other_files_or_overwrite_email(self):
        for preserved in [[module.PROOF_ENDPOINT], ['private/config.php'], [module.PRODUCTION_ENDPOINT]]:
            with self.subTest(preserved=preserved):
                with self.assertRaisesRegex(ValueError, 'Invalid preserved endpoint'):
                    self.run_package(preserved=preserved)
                self.assertFalse(self.output.exists())

    def test_mode_must_match_manifest(self):
        with self.assertRaisesRegex(ValueError, 'production manifest'):
            self.run_package(manifest_mode='preview')
        with self.assertRaisesRegex(ValueError, 'preview manifest'):
            self.run_package(mode='preview')
        self.assertFalse(self.output.exists())

    def test_public_proof_handler_and_rule_ship_together(self):
        self.write(module.PROOF_ENDPOINT, b'<?php // synthetic public proof')
        with self.assertRaisesRegex(ValueError, 'ship together'):
            self.run_package()
        self.write('.htaccess', (module.PRODUCTION_ENDPOINT_RULE + '\n' + module.PROOF_ENDPOINT_RULE + '\n').encode())
        self.assertEqual(self.run_package()['files'], 4)
        with ZipFile(self.output) as archive:
            self.assertEqual(archive.read(module.PROOF_ENDPOINT), b'<?php // synthetic public proof')

    def test_other_server_files_refused(self):
        for name in ['server/tests/send-email-test.php', 'server/README.txt', 'server/send-email-config.example.php', 'api/other.php']:
            with self.subTest(name=name):
                self.setUp()
                self.write(name, b'synthetic')
                with self.assertRaisesRegex(ValueError, 'Unsafe'):
                    self.run_package()
                self.assertFalse(self.output.exists())

    def test_google_aggregate_requires_its_rule_and_helper(self):
        self.write(module.GOOGLE_ENDPOINT, b'<?php // synthetic Google aggregate')
        with self.assertRaisesRegex(ValueError, 'ship together'):
            self.run_package()
        self.write('.htaccess', (module.PRODUCTION_ENDPOINT_RULE + '\n' + module.GOOGLE_ENDPOINT_RULE + '\n').encode())
        with self.assertRaisesRegex(ValueError, 'helper'):
            self.run_package()
        self.write(module.PROOF_ENDPOINT, b'<?php // synthetic helper')
        self.write('.htaccess', (module.PRODUCTION_ENDPOINT_RULE + '\n' + module.GOOGLE_ENDPOINT_RULE + '\n' + module.PROOF_ENDPOINT_RULE + '\n').encode())
        self.assertEqual(self.run_package()['files'], 5)
        with ZipFile(self.output) as archive:
            self.assertEqual(archive.read(module.GOOGLE_ENDPOINT), b'<?php // synthetic Google aggregate')

    def test_endpoint_and_rewrite_required(self):
        self.rows = [row for row in self.rows if row['path'] != module.PRODUCTION_ENDPOINT]
        with self.assertRaisesRegex(ValueError, 'send-email endpoint'):
            self.run_package()
        self.setUp()
        self.write('.htaccess', b'# no rewrite')
        with self.assertRaisesRegex(ValueError, 'send-email endpoint'):
            self.run_package()

    def test_preview_settings_and_references_refused(self):
        self.write('.htaccess', (module.PRODUCTION_ENDPOINT_RULE + '\nHeader always set X-Robots-Tag "noindex, nofollow"\n').encode())
        with self.assertRaisesRegex(ValueError, 'preview settings'):
            self.run_package()
        for body in [b'<a href="https://preview.fresh-tech.uk/">x</a>', b'<div class="prototype-banner">x</div>', b'fetch("/.netlify/functions/x")']:
            with self.subTest(body=body):
                self.setUp()
                self.write('index.html', body)
                with self.assertRaisesRegex(ValueError, 'Preview-only reference'):
                    self.run_package()
                self.assertFalse(self.output.exists())

    def test_preview_mode_still_refuses_php(self):
        self.manifest.write_text(json.dumps({'schemaVersion': 1, 'mode': 'preview', 'files': self.rows}))
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            module.package(self.source, self.manifest, self.output)


if __name__ == '__main__':
    unittest.main()
