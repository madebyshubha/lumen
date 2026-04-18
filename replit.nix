{pkgs}: {
  deps = [
    pkgs.libgbm
    pkgs.freetype
    pkgs.fontconfig
    pkgs.cairo
    pkgs.pango
    pkgs.dbus
    pkgs.alsa-lib
    pkgs.mesa
    pkgs.xorg.libXext
    pkgs.xorg.libXrandr
    pkgs.xorg.libXfixes
    pkgs.xorg.libXdamage
    pkgs.xorg.libXcomposite
    pkgs.xorg.libX11
    pkgs.xorg.libxcb
    pkgs.libxkbcommon
    pkgs.expat
    pkgs.libdrm
    pkgs.cups
    pkgs.at-spi2-atk
    pkgs.atk
    pkgs.nspr
    pkgs.nss
    pkgs.glib
  ];
}
