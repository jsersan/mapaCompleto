// Cargo por defecto un fichero JSON

const urlBase = "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/hoteles_de_euskadi/opendata/alojamientos.json";
document.addEventListener("DOMContentLoaded", () => crearScript(urlBase));
let script;
let mapa;
let tipo = "";
let markers = [];

let emoticon; 

// Objeto leyenda
let legend = null;
legend = document.getElementById("legend");

//Sólo querenos
let inicio = false;

function jsonCallback(data) {

    // Obtengo la data por Callback ya que así está puesto en el repositorio de datos de openData Euskadi
    var valores = getGET();

    //Modificado 20/04 --------------------------------

    tipo = emoticon;

    // console.log("Este tipo es:" + tipo);

    fichero = cargarDatos(tipo);
    initMap();
    colocarPines(data, tipo);
}

function crearScript(url) {

    //Funcón qjue nos permite colocar la data desde el inicio a través de la url
    //console.log("La url es:" + url);
    script = document.createElement("script");
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

// Función que nos permite recoger los parámetros por la url vía get

function getGET() {
    // capturamos la url
    var loc = document.location.href;

    // si existe el interrogante
    if (loc.indexOf("?") > 0) {
        // cogemos la parte de la url que hay despues del interrogante
        var getString = loc.split("?")[1];

        // obtenemos un array con cada clave=valor
        var GET = getString.split("&");
        var get = {};

        // recorremos todo el array de valores
        for (var i = 0, l = GET.length; i < l; i++) {
            var tmp = GET[i].split("=");
            get[tmp[0]] = unescape(decodeURI(tmp[1]));
        }
        return get;
    }
}

// Pinta el mapa centrada en una coordenadas (Creo que es Elorrio)
function initMap() {
    const LatLong = {
        lat: 43.2603479,
        lng: -2.933411
    };
    //console.log(latLng);
    this.mapa = new google.maps.Map(document.getElementById("mapa"), {
        center: LatLong,
        zoom: 9
    });
    return;
}

// Función para colocar los pines

function colocarPines(data, tipo) {
    let lat;
    let lng;
    let nombre;
    let provincia;
    let municipio;
    let direccion;
    let paginaWeb;
    let fax;
    let carteraServicios;
    let estrellas;
    let infoWindowActivo;

    console.log(data);
    console.log(tipo);

    // Juego de iconos que vamos a utilizas

    var iconBase = "https://maps.google.com/mapfiles/kml/shapes/";
    var icons = {
        hoteles: {
            name: "hoteles",
            icon: iconBase + "lodging_maps.png"
        },
        museos: {
            name: "museos",
            icon: iconBase + "museum_maps.png"
        },
        aeropuertos: {
            name: "aeropuertos",
            icon: iconBase + "airports_maps.png"
        },
        restaurantes: {
            name: "restaurantes",
            icon: iconBase + "dining_maps.png"
        },
        hospitales: {
            name: "hospitales",
            icon: iconBase + "hospitals_maps.png"
        },
        topturismo: {
            name: "topturismo",
            icon: iconBase + "camera_maps.png"
        }
    };

    let tipoEstablecimiento;

    // Colocamos la leyenda
    if (!inicio) {
        for (var key in icons) {
            var type = icons[key];
            var name = type.name;
            var icon = type.icon;
            var div = document.createElement("div");
            div.setAttribute("id", "leyenda");
            var enlace =
                '<a href="' +
                "index.html?tipo=" +
                name +
                '"><img src="' +
                icon +
                '">' +
                name +
                "</a>";

            div.innerHTML = enlace;

            legend.appendChild(div);
        }
        inicio = true;
    }

    // Colocamos la leyenda abajo a la derecha

    this.mapa.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);

    // Recorremos la data para ir colocando los pines
    data.forEach(element => {
        // En función del tipo cambiará el icono
        tipoEstablecimiento = tipo;

        //Coordenas geográficas
        lat = element.latwgs84;
        lng = element.lonwgs84;

        provincia = element.territory;
        municipio = element.municipality;
        direccion = element.address;
        telefono = element.phone;
        fax = element.Fax;
        descripcion = element.turismDescription;

        //Si fuera un hotel
        estrellas = element.category;

        //Si fuera un restaurante
        michelin = element.michelinStar;

        //Si fuera un alojamiento sanitario

        tipoCentroSalud = element.Tipodecentro;

        if (lat != null || lng != null) {
            lat = lat.replace(",", ".");
            lng = lng.replace(",", ".");
        }

        const coordenadas = {
            lat: Number(lat),
            lng: Number(lng),
            tipo: tipoEstablecimiento
        };

        // Hospitales: hay que hacerlo así porque los figuras de openData cambiaron los nombres de las variables del objeto JSON

        if (tipo === "hospitales") {
            console.log('Poniendo datos de hospitales');
            nombre = element.Nombre;
            paginaWeb = element.Paginaweb;
            lat = element.LATWGS84;
            lng = element.LONWGS84;
            direccion = element.Direccion;
            telefono = element.Telefono;
            municipio = element.Municipio;
            provincia = element.Provincia;
            carteraServicios = element.CarteradeServicios;
        } else {
            nombre = element.documentName;
            paginaWeb = element.web;
        }

        // Solo queremos mostrar los hoteles de más de tres estrellas y restaurantes con estrellas michelín

        if (((tipo === 'hoteles') && (estrellas >= 3)) ||
            ((tipo === 'restaurantes') && (michelin >= 1)) ||
            ((tipo === 'museos') || (tipo === 'aeropuertos') || (tipo === 'topturismo') || (tipo === 'hospitales') && (tipoCentroSalud === 'Hospital')))

        {
            // Creamos la marca
            let marker = new google.maps.Marker({
                position: coordenadas,
                map: this.mapa,
                icon: icons[coordenadas.tipo].icon,
                tipo: tipoEstablecimiento
            });
            markers.push(marker);

            // Creamos la ventana de información
            let infoWindow = crearInfoWindow(
                nombre,
                provincia,
                municipio,
                direccion,
                telefono,
                fax,
                paginaWeb,
                carteraServicios,
                tipoEstablecimiento,
                descripcion,
                estrellas,
                michelin
            );

            // Agregamos la marca
            marker.addListener("click", () => {
                if (infoWindowActivo) {
                    infoWindowActivo.close();
                }

                infoWindow.open(this.mapa, marker);
                infoWindowActivo = infoWindow;
            });
        }
    });
    return
}

// Construimos la ventana de información
function crearInfoWindow(
    nombre,
    provincia,
    municipio,
    direccion,
    telefono,
    fax,
    paginaWeb,
    carteraServicios,
    tipo,
    descripcion,
    estrellas,
    michelin
) {

    // Como hay sitios con errores en el JSON hay que filtrarlos
    if (tipo === 'hospitales') {
        if (paginaWeb == undefined) {
            paginaWeb = "http://www.osakidetza.net";
        } else if (paginaWeb == "/r85-ghodon00/es") {
            paginaWeb = "http://www.osakidetza.net" + paginaWeb;
        } else if (paginaWeb == "/r85-ghhpsq00/es/") {
            paginaWeb = "http://www.osakidetza.net";
        } else if (paginaWeb == "85-ghrsmb00/es/") {
            paginaWeb = "http://www.osakidetza.net";
        }
    } else {
        // Donde la página web no exista le ponemos una por defecto
        if (paginaWeb === undefined) {
            {
                if (tipo === 'restaurantes') {
                    paginaWeb =
                        "https://www.restopolitan.es/restaurante/euskadi-49207.html";
                } else if (tipo === 'museo') {
                    paginaWeb =
                        "http://www.euskadi.eus/directorio-de-museos/web01-a2muszen/es/";
                }
            }
        } else {
            // Como todas las urls no tienen el mismo formato.....

            if (paginaWeb.substr(1, 3) === 'www') {
                paginaWeb = "http://" + paginaWeb;
                console.log(paginaWeb);
            }
        }
    }

    // Tomamos la imagen para pintar las estrellas del local

    let marcaStar = `<img src='http://maps.google.com/mapfiles/kml/pal4/icon47.png'>`;
    let marcaMich = `<img src='http://maps.google.com/mapfiles/kml/pal4/icon47.png'>`;

    let markerInfo = `
    <h1>${nombre}</h1>`;

    // Agregamos tantas estrellas como tenga el local
    // Simplemente gereramos una imagen que añadiremos al template

    stars = (Number)(estrellas);
    for (i = 1; i < stars; i++) {
        marcaStar += `<img src='http://maps.google.com/mapfiles/kml/pal4/icon47.png'>`;
    }

    let michelines = (Number)(michelin);

    for (i = 1; i < michelines; i++) {
        marcaMich += `<img src='http://maps.google.com/mapfiles/kml/pal4/icon47.png'>`;
    }

    // Solo hoteles con tres estrellas o más y restaurante con estrellas michelin
    if ((tipo === 'hoteles') && stars > 2) {
        markerInfo += `${marcaStar}`;
    } else if ((tipo === 'restaurantes') && (michelines > 0)) {
        markerInfo += `${marcaMich}`;
    }

    // El resto de los campos si están presentes

    if (carteraServicios !== undefined) {
        markerInfo += `
        <br><b>Cartera de Servicios</b>: ${carteraServicios}`;
    }
    if (direccion !== undefined) {
        markerInfo += `
        <br><b>Dirección</b>: ${direccion}`;
    }
    if (telefono !== undefined) {
        markerInfo += `
        <br><b>Teléfono</b>: ${telefono}`;
    }
    if (fax !== undefined) {
        markerInfo += `
        <br><b>Fax</b>: ${fax}`;
    }
    if (municipio !== undefined) {
        markerInfo += `
        <br><b>Muncipio</b>: ${municipio}`;
    }
    if (provincia !== undefined) {
        markerInfo += `
        <br><b>Provincia</b>: ${provincia}`;
    }

    if ((descripcion !== "") && (descripcion !== undefined)) {
        markerInfo += `
            <br><b>Descripcion</b>: ${descripcion}</br>
            `;
    }

    markerInfo += `
    <br><b>Más información</b>: <a href='${paginaWeb}'< target='_blank'/a>Sitio Web</p> 
    `;

    // Agrego la información a la ventana de información
    infoWindow = new google.maps.InfoWindow({
        content: markerInfo
    });

    return infoWindow;
}

// Función que indica en openData donde está el fichero de  datos requerido

function cargarDatos(tipo) {
    let fichero;
    switch (tipo) {
        case "restaurantes":
            console.log("Restaurantes");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/restaurantes_sidrerias_bodegas/opendata/restaurantes.json?callback=jsonCallback";
            break;

        case "hoteles":
            console.log("Hoteles");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/hoteles_de_euskadi/opendata/alojamientos.json?callback=jsonCallback";
            break;

        case "hospitales":
            console.log("Hospitales");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_localizaciones/centros_salud_en_euskadi/opendata/centros-salud.json?callback=jsonCallback";
            break;

        case "aeropuertos":
            console.log("Aeropuerto");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/aeropuertos_euskadi/opendata/transporte.json?callback=jsonCallback";
            break;

        case "museos":
            console.log("museos");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/museos_centros_interpretacion/opendata/museos.json?callback=jsonCallback";
            break;

        case "topturismo":
            console.log("turismo");
            fichero =
                "http://opendata.euskadi.eus/contenidos/ds_recursos_turisticos/top_euskadi/opendata/top-euskadi.json?callback=jsonCallback";
            break;

    }
    return fichero;
}

function abrirFichero(fichero) {
    // console.log(fichero);
    var script = document.createElement("script");
    script.src = `${fichero}`;
    document.getElementsByTagName("head")[0].appendChild(script);
}

function elemento(e) {
    if (e.srcElement) tag = e.srcElement.text;
    else if (e.target) tag = e.target.text;

    // console.log("Elemento:" + e.srcElement.text);
    var target = e.target.text;

    let fichero = cargarDatos(tag);
    emoticon = e.target.text; //Modificado 20/04.

    abrirFichero(fichero);

}

/* Añadidas las funciones elemento, que determina que se ha seleccionado y ejecuta abrirFichero. Esta funcion compone el script con el fichero
correspondiente que ejecuta la funcion jsonCallback.  */ //