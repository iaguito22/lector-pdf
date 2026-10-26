# Maintainer: Iago <igl2005@hotmail.com>
pkgname=lector-pdf
pkgver=1.0.0
pkgrel=1
pkgdesc="Lector de PDF minimalista con barra de herramientas magnética adaptativa"
arch=('x86_64')
url="https://github.com/iaguito22/lector-pdf"
license=('MIT')
depends=('webkit2gtk-4.1' 'gtk3' 'cairo' 'gdk-pixbuf2' 'glib2')
makedepends=('cargo' 'pnpm' 'nodejs')
source=("$pkgname-$pkgver.tar.gz::$url/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
  cd "$srcdir/$pkgname-$pkgver"
  pnpm install --frozen-lockfile
  pnpm build
  cargo build --manifest-path src-tauri/Cargo.toml --release
}

package() {
  cd "$srcdir/$pkgname-$pkgver"
  install -Dm755 "src-tauri/target/release/lector-pdf" "$pkgdir/usr/bin/lector-pdf"
  install -Dm644 "src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/lector-pdf.png"
  
  install -d "$pkgdir/usr/share/applications"
  cat > "$pkgdir/usr/share/applications/lector-pdf.desktop" <<EOF
[Desktop Entry]
Name=Lector PDF
Comment=Lector de PDF minimalista con barra magnética
Exec=lector-pdf %U
Icon=lector-pdf
Terminal=false
Type=Application
Categories=Office;Viewer;
MimeType=application/pdf;
EOF
}
