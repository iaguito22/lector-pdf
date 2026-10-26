# Lector PDF

> Lector de PDF minimalista e innovador con **barra de herramientas magnética adaptativa** para maximizar el espacio de lectura en pantalla.

Diseñado con estética neutra y vidrio esmerilado (*Caelestia Glass*), se adapta de forma nativa al tema del sistema (claro u oscuro) y reubica sus herramientas dinámicamente según la geometría del documento para que el PDF ocupe el 100% de la ventana sin distracciones.

---

## Características

- 🧭 **Barra magnética adaptativa**: Conmuta automáticamente entre orientación vertical (en los márgenes laterales al ajustar a la página) y horizontal centrada (al ajustar al ancho), garantizando cero solapamiento sobre el contenido.
- 🎯 **Navegación y salto directo**: Campo numérico editable `[ N ] / Total` en la propia píldora para viajar a cualquier diapositiva o página escribiendo su número (`Enter` o atajo `G`).
- 🔍 **Ajuste inteligente de zoom**: Modos de un solo toque para Ajustar a la Página (`P` / `0`), Ajustar al Ancho (`W`), zoom fino (`+` / `-`) e indicador de porcentaje en tiempo real.
- 🌓 **Tema adaptativo al sistema**: Paleta neutra (zinc / grafito / pizarra) sincronizada con el tema del sistema operativo (`prefers-color-scheme`), más modos adicionales de confort visual (`Sepia`, `OLED`, `E-Ink` vía atajo `M`).
- 🧘 **Modo Zen**: Atenuación suave de la barra flotante al 12% durante la lectura para máxima inmersión (`Z`), recuperando visibilidad al interactuar.
- 📑 **Índice y buscador integrados**: Navegación jerárquica por capítulos (`I`) y búsqueda instantánea en texto completo con resaltado de coincidencias (`Ctrl+F`).

---

## Descargas

Encuentra los binarios listos para instalar en la sección de **[Releases](https://github.com/iaguito22/lector-pdf/releases)**:

| Plataforma | Paquete | Descripción |
| :--- | :--- | :--- |
| **Windows** | `Lector-PDF_1.0.0_x64-setup.exe` | Instalador nativo para Windows 10 / 11 |
| **Arch Linux** | `lector-pdf-1.0.0-1-x86_64.pkg.tar.zst` | Paquete nativo de Pacman (`pacman -U`) |
| **Debian / Ubuntu** | `lector-pdf_1.0.0_amd64.deb` | Paquete `.deb` (`dpkg -i` o `apt install`) |
| **Linux Universal** | `lector-pdf_1.0.0_amd64.AppImage` | Ejecutable portable sin instalación |

### Instalación en Arch Linux

```bash
# Con el paquete precompilado
sudo pacman -U lector-pdf-1.0.0-1-x86_64.pkg.tar.zst

# O usando el PKGBUILD incluido
makepkg -si
```

### Instalación en Debian / Ubuntu

```bash
sudo dpkg -i lector-pdf_1.0.0_amd64.deb
sudo apt-get install -f  # resuelve dependencias si faltan
```

---

## Atajos de Teclado

| Atajo | Acción |
| :--- | :--- |
| `G` | Enfocar input numérico para saltar a diapositiva |
| `P` o `0` | Ajustar a la página (encaje vertical completo) |
| `W` | Ajustar al ancho del documento |
| `+` / `-` | Aumentar / reducir zoom (10%) |
| `I` | Abrir / cerrar panel de índice (TOC) |
| `Ctrl + F` | Búsqueda en texto completo |
| `Ctrl + O` | Abrir archivo PDF local |
| `M` | Conmutar modos de lectura (Sistema / Sepia / OLED / E-Ink) |
| `Z` | Activar / desactivar modo Zen |
| `Escape` | Cerrar paneles flotantes |

---

## Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/iaguito22/lector-pdf.git
cd lector-pdf

# Instalar dependencias
pnpm install

# Modo desarrollo web
pnpm dev

# Modo aplicación de escritorio Tauri
pnpm tauri dev

# Compilar binarios de producción
pnpm tauri build
```

---

## Licencia

Distribuido bajo licencia MIT.
