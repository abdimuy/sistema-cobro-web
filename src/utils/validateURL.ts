export default function validateURL(url: string) {
  const errores = [];

  // 1. La URL no debe tener espacios
  if (/\s/.test(url)) {
    errores.push("La URL no debe contener espacios en blanco.");
  }

  // 2. Debe iniciar con http:// o https://
  if (!/^https?:\/\//.test(url)) {
    errores.push('La URL debe iniciar con "http://" o "https://".');
  }

  // 3. Debe terminar con /
  if (!url.endsWith("/")) {
    errores.push('La URL debe terminar con "/".');
  }

  // Ahora, independientemente de que ya haya errores arriba,
  // podemos seguir revisando host/puerto/ruta para notificar
  // todos los problemas posibles.

  // Quitamos el protocolo ("http://", "https://") y la barra final "/"
  // para analizar la parte de host, puerto y ruta
  const sinProtocoloNiBarra = url
    .replace(/^https?:\/\//, "") // quita "http://" o "https://"
    .replace(/\/$/, ""); // quita la barra "/" del final

  // Buscamos la primera "/" para separar host:puerto de la ruta
  const idxBarra = sinProtocoloNiBarra.indexOf("/");
  let hostYPuerto, ruta;
  if (idxBarra === -1) {
    hostYPuerto = sinProtocoloNiBarra; // no hay más "/", todo es host(+puerto)
    ruta = "";
  } else {
    hostYPuerto = sinProtocoloNiBarra.substring(0, idxBarra);
    ruta = sinProtocoloNiBarra.substring(idxBarra + 1);
  }
  console.log(ruta);

  // 4. Verificar si hay puerto (ej. "example.com:8080" -> puerto=8080)
  let host = hostYPuerto;
  let puerto = null;
  const idxDosPuntos = hostYPuerto.lastIndexOf(":");
  if (idxDosPuntos !== -1) {
    // Hay un posible puerto
    host = hostYPuerto.substring(0, idxDosPuntos);
    puerto = hostYPuerto.substring(idxDosPuntos + 1);

    // ¿Es un número entero?
    if (!/^\d+$/.test(puerto)) {
      errores.push("El puerto debe ser un número entero.");
    } else {
      const numPuerto = parseInt(puerto, 10);
      // Rango típico de puertos 1–65535
      if (numPuerto < 1 || numPuerto > 65535) {
        errores.push("El puerto debe estar en el rango [1–65535].");
      }
    }
  }

  // 5. Validar host
  //    - localhost
  //    - IPv4 (p.ej. 192.168.0.1)
  //    - Dominio (p.ej. example.com)
  if (!host) {
    // Host vacío
    errores.push("No se especificó un host.");
  } else if (host === "localhost") {
    // "localhost" es válido
  } else if (esIPValida(host)) {
    // IPv4 válida
  } else if (esDominioValido(host)) {
    // Dominio válido
  } else {
    errores.push(
      'El host no es válido. Debe ser "localhost", una IPv4 o un dominio (ej: "example.com").'
    );
  }

  // (Opcional) Podrías validar la ruta aquí, si fuese necesario
  // para asegurarte de que no tenga caracteres no deseados.
  // Pero como ya revisamos espacios, puede que no haga falta.
  // if (ruta.includes(' ')) { ... } etc.

  // Al final, si no hay errores, la URL es válida
  return {
    valido: errores.length === 0,
    errores,
  };
}

// ======================
// Funciones auxiliares
// ======================

/**
 * Verifica si la cadena es una IPv4 válida: 4 octetos, cada uno entre 0 y 255.
 */
function esIPValida(ip: string) {
  // Debe ser algo como "192.168.0.1"
  const octetos = ip.split(".");
  if (octetos.length !== 4) {
    return false;
  }
  return octetos.every((octeto) => {
    if (!/^\d+$/.test(octeto)) {
      return false;
    }
    const num = parseInt(octeto, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Verifica si la cadena es un dominio “básicamente” válido.
 * - Al menos un punto (ej: "example.com").
 * - Cada parte entre puntos con [a-zA-Z0-9-]+ (sin empezar/terminar en guión).
 */
function esDominioValido(dominio: string) {
  // Este regex no cubre caracteres internacionales (IDN)
  // ni otros TLDs exóticos, pero sí cubre lo básico.
  // Permite uno o más "segmentos" separados por punto (opcional)
  // Cada "segmento" debe ser alfanumérico o guionado [a-zA-Z0-9-],
  // sin restringir a la fuerza que haya un punto:
  const reDominio = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*$/;
  return reDominio.test(dominio);
}
