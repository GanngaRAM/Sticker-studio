const input = document.getElementById('imageInput');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const fileName = document.getElementById('fileName');
const statusText = document.getElementById('status');
const removeBg = document.getElementById('removeBg');
const tolerance = document.getElementById('tolerance');
const cornerSelect = document.getElementById('corner');
const toleranceValue = document.getElementById('toleranceValue');
let cutout = null;
let picture = null;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!picture) return;
  const image = removeBg.checked ? cutout : picture;
  if (!image) return;
  const scale = Math.min(360 / image.width, 290 / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  const left = (canvas.width - width) / 2;
  const top = (canvas.height - height) / 2;
  ctx.drawImage(image, left, top, width, height);
}
function makeCutout() {
  if (!picture) return;
  const scale = Math.min(1, 1000 / Math.max(picture.width, picture.height));
  cutout = document.createElement('canvas');
  cutout.width = Math.round(picture.width * scale);
  cutout.height = Math.round(picture.height * scale);
  const cutCtx = cutout.getContext('2d', { willReadFrequently: true });
  cutCtx.drawImage(picture, 0, 0, cutout.width, cutout.height);
  const pixels = cutCtx.getImageData(0, 0, cutout.width, cutout.height);
  const data = pixels.data;
  const right = cutout.width - 1;
  const bottom = cutout.height - 1;
  let x = 0;
  let y = 0;
  if (cornerSelect.value.includes('right')) x = right;
  if (cornerSelect.value.includes('bottom')) y = bottom;
  const cornerIndex = (y * cutout.width + x) * 4;
  const corner = data.slice(cornerIndex, cornerIndex + 4);
  if (corner[3] === 0) return;
  const limit = Number(tolerance.value);
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i] - corner[0];
    const green = data[i + 1] - corner[1];
    const blue = data[i + 2] - corner[2];
    const distance = Math.sqrt(red * red + green * green + blue * blue);
    const fade = Math.max(0, Math.min(1, (distance - limit) / 24));
    data[i + 3] = Math.round(data[i + 3] * fade);
  }
  cutCtx.putImageData(pixels, 0, 0);
}
input.addEventListener('change', () => {
  const file = input.files[0];
  if (!file) return;
  if (picture) URL.revokeObjectURL(picture.src);
  const image = new Image();
  image.onload = () => {
    picture = image;
    makeCutout();
    fileName.textContent = file.name;
    statusText.textContent = 'Image loaded';
    draw();
  };
  image.src = URL.createObjectURL(file);
});

removeBg.addEventListener('change', draw);
tolerance.addEventListener('input', () => {
  toleranceValue.textContent = tolerance.value;
  makeCutout();
  draw();
});
cornerSelect.addEventListener('change', () => {
  makeCutout();
  draw();
});
