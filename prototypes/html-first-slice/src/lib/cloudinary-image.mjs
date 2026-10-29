// Responsive widths for Cloudinary images. Content records store image URLs in a
// few shapes: `upload/<id>`, `upload/v123/<id>`, `upload/f_auto,q_auto/<id>` and
// `upload/f_auto,q_auto/v123/<id>`. Each becomes `upload/f_auto,q_auto,w_<n>/[v123/]<id>`
// at the given widths (no crop, so object-fit decides what is visible). Any other
// URL, including video posters and already-sized transformations, gets no srcset.
const CLOUDINARY_IMAGE = /^(https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/)(?:f_auto,q_auto\/)?((?:v\d+\/)?[^/?#,]+)$/;
export function cloudinarySrcset(url, widths) {
  const match = typeof url === 'string' ? url.match(CLOUDINARY_IMAGE) : null;
  return match ? widths.map(width => `${match[1]}f_auto,q_auto,w_${width}/${match[2]} ${width}w`).join(', ') : undefined;
}
