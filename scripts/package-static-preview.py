"""Package a reviewed public preview manifest with explicit Apache-safe modes."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import stat
import tempfile
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

# Reserved attribute that marks synthetic-fixture testimonial markup. Any HTML
# artifact carrying it as a real element attribute, whatever the value or
# case, is refused before any archive is written. The same string inside
# text, comments or script bodies is not an attribute and is not a marker.
RESERVED_FIXTURE_ATTRIBUTE = 'data-testimonials-fixture'


class _ReservedAttributeFinder(HTMLParser):
    """Records elements carrying the reserved fixture attribute via parsed tags only."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found = []

    def handle_starttag(self, tag, attrs):
        for name, _value in attrs:
            if name.lower() == RESERVED_FIXTURE_ATTRIBUTE:
                self.found.append(tag)
                return

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def reserved_fixture_elements(html_bytes):
    """Return the tag names that carry the reserved fixture attribute in one HTML document."""
    finder = _ReservedAttributeFinder()
    finder.feed(html_bytes.decode('utf-8', errors='replace'))
    finder.close()
    return finder.found


# Only these reviewed server-side handlers may be included. Never private config.
PRODUCTION_ENDPOINT = 'server/api/send-email.php'
PRODUCTION_ENDPOINT_RULE = 'RewriteRule ^api/send-email$ /server/api/send-email.php [END]'
PROOF_ENDPOINT = 'server/api/website-proof.php'
PROOF_ENDPOINT_RULE = 'RewriteRule ^api/website-(metrics|feedback)$ /server/api/website-proof.php [END]'
GOOGLE_ENDPOINT = 'server/api/google-rating.php'
GOOGLE_ENDPOINT_RULE = 'RewriteRule ^api/google-rating$ /server/api/google-rating.php [END]'
PREVIEW_MARKERS = (b'preview.fresh-tech.uk', b'class="prototype-banner"', b'/.netlify/')


def package(source, manifest_path, output, mode='preview'):
    if mode not in ('preview', 'production'):
        raise ValueError('Mode must be preview or production')
    if source.is_symlink() or getattr(source, 'is_junction', lambda: False)():
        raise ValueError('Source root must not be a link')
    source = source.resolve(strict=True)
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('schemaVersion') != 1 or manifest.get('mode') != mode:
        raise ValueError(f'Expected an approved version 1 {mode} manifest')
    allowed = {'.avif', '.css', '.gif', '.html', '.ico', '.jpeg', '.jpg', '.js',
               '.json', '.mjs', '.otf', '.pdf', '.png', '.svg', '.ttf', '.txt',
               '.webmanifest', '.webp', '.woff', '.woff2', '.xml'}
    files, directories = {}, set()
    for row in manifest['files']:
        name = row['path']
        relative = PurePosixPath(name)
        endpoint = mode == 'production' and name in (PRODUCTION_ENDPOINT, PROOF_ENDPOINT, GOOGLE_ENDPOINT)
        if (relative.is_absolute() or '..' in relative.parts or '\\' in name
                or ':' in name or str(relative) != name or name in files
                or (name != '.htaccess' and not endpoint and (relative.suffix.lower() not in allowed
                    or any(part.startswith('.') for part in relative.parts)))
                or (mode == 'production' and not endpoint and relative.parts[0] == 'server')):
            raise ValueError('Unsafe or duplicate public artifact path')
        path = source.joinpath(*relative.parts)
        if any(parent.is_symlink() for parent in [path, *path.parents] if parent.is_relative_to(source)):
            raise ValueError('Symlinks are not allowed in public artifacts')
        if not path.resolve(strict=True).is_relative_to(source):
            raise ValueError('Artifact escapes its source directory')
        body = path.read_bytes()
        if len(body) != row['bytes'] or hashlib.sha256(body).hexdigest() != row['sha256']:
            raise ValueError(f'Artifact differs from manifest: {name}')
        if relative.suffix.lower() == '.html':
            tags = reserved_fixture_elements(body)
            if tags:
                raise ValueError(f'Reserved {RESERVED_FIXTURE_ATTRIBUTE} attribute on <{tags[0]}> in {name}: '
                                 'synthetic fixture markup must not be published')
        files[name] = body
        directories.update(str(parent) + '/' for parent in relative.parents if str(parent) != '.')
    if 'index.html' not in files or '.htaccess' not in files:
        raise ValueError('Preview must contain root HTML and routing configuration')
    if mode == 'production':
        htaccess = files['.htaccess'].decode('utf-8')
        preserved = manifest.get('preservedFiles', [])
        if preserved not in ([], [PRODUCTION_ENDPOINT]) or any(name in files for name in preserved):
            raise ValueError('Invalid preserved endpoint declaration')
        if (PRODUCTION_ENDPOINT not in files and PRODUCTION_ENDPOINT not in preserved) or PRODUCTION_ENDPOINT_RULE not in htaccess:
            raise ValueError('Production must contain the send-email endpoint and its rewrite')
        if (PROOF_ENDPOINT in files) != (PROOF_ENDPOINT_RULE in htaccess):
            raise ValueError('Public proof handler and rewrite must ship together')
        if (GOOGLE_ENDPOINT in files) != (GOOGLE_ENDPOINT_RULE in htaccess):
            raise ValueError('Google rating endpoint and rewrite must ship together')
        if GOOGLE_ENDPOINT in files and PROOF_ENDPOINT not in files:
            raise ValueError('Google rating endpoint requires the public JSON helper')
        if 'X-Robots-Tag' in htaccess or 'preview.fresh-tech.uk' in htaccess:
            raise ValueError('Production routing configuration contains preview settings')
        for name, body in files.items():
            if PurePosixPath(name).suffix.lower() in ('.html', '.js', '.xml', '.txt', '.css') and any(marker in body for marker in PREVIEW_MARKERS):
                raise ValueError(f'Preview-only reference in production artifact: {name}')
    if output.exists() or output.is_symlink():
        raise FileExistsError('Output already exists')
    # Verify an owned sibling temporary file before atomic, no-clobber publication.
    # A killed process may leave a temporary file, but never a partial final ZIP.
    stream = tempfile.NamedTemporaryFile(mode='w+b', prefix=output.name + '.', suffix='.tmp', dir=output.parent, delete=False)
    temporary = Path(stream.name)
    try:
        with stream:
            with ZipFile(stream, 'w', compression=ZIP_DEFLATED) as archive:
                for name in sorted(directories) + sorted(files):
                    directory = name.endswith('/')
                    info = ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
                    info.create_system = 3
                    info.compress_type = ZIP_DEFLATED
                    info.external_attr = ((stat.S_IFDIR | 0o755) if directory else (stat.S_IFREG | 0o644)) << 16
                    if directory:
                        info.external_attr |= 0x10
                    archive.writestr(info, b'' if directory else files[name])
            stream.flush()
            os.fsync(stream.fileno())
        with ZipFile(temporary) as archive:
            for item in archive.infolist():
                expected = 0o755 if item.is_dir() else 0o644
                if stat.S_IMODE(item.external_attr >> 16) != expected:
                    raise ValueError('Archive mode verification failed')
                if not item.is_dir() and archive.read(item) != files[item.filename]:
                    raise ValueError('Archive content verification failed')
        os.link(temporary, output)
    finally:
        stream.close()
        temporary.unlink(missing_ok=True)
    return {'files': len(files), 'directories': len(directories),
            'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bytes': output.stat().st_size}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--manifest', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--mode', choices=('preview', 'production'), default='preview')
    args = parser.parse_args()
    print(json.dumps(package(args.source, args.manifest, args.out, args.mode), indent=2))
