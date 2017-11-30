# miekify
Miekify es una aplicación web codificada en AngularJS basada principalmente en la interfaz aplicada de programación de Spotify. Esta API web permite a la aplicación obtener datos del catálogo de música de Spotify, administrar las listas de reproducción y la música almacenada en las cuentas de usuarios. Principalmente, nuestro objetivo es crear una lista de reproducción nueva en la cuenta del usuario que ha iniciado de sesión. La lista creada contendrá canciones nuevas para el usuario que fueron recomendadas mediante un algoritmo analitico tomando como entrada las canciones inicialmente presentes en la cuenta. Además, Miekify hace uso de la infraestructura proporcionada por Amazon Web Services, principalmente los servicios de Amazon RDS y Amazon Lambda, junto con Amazon API Gateway.

AngularJS

AngularJS fue implementado para lograr los siguientes objetivos:

- Para desacoplar la manipulación DOM de la lógica de la aplicación
- Para desacoplar el lado del cliente de la aplicación desde el lado del servidor. Esto permite que el trabajo de desarrollo progrese en paralelo y permite la reutilización de ambos lados.
- Para proporcionar la estructura MVC de la aplicación: desde el diseño de la interfaz de usuario, a través de la escritura de la lógica, hasta la prueba.

Spotify API

Basados en principios simples de REST, los puntos finales (endpoints) de la API de Spotify devuelven metadatos en formato JSON sobre artistas, álbumes y pistas directamente desde el catálogo de Spotify. La API también proporciona acceso a datos relacionados con el usuario, como listas de reproducción y música guardadas en una biblioteca, sujeto a la autorización del usuario.

El servicio proporcionado de mayor importancia para este proyecto es Get Audio Features (https://developer.spotify.com/web-api/get-audio-features/). En este servicio, se puede obtener información sobre las características de audio para pistas identificadas por su ID única de Spotify. Se analiza el resultado de este endpoint para proveer las canciones más recomendables para el usuario. Estos atributos son medidos a partir de una escala 0.0 a 1.0 y  son las siguientes: 

- Acousticness: 1.0 representa una alta confianza de que la pista es acústica.
- Danceability: Describe qué tan adecuada es una pista para bailar en función de una combinación de elementos musicales, incluidos el tempo, la estabilidad rítmica, la potencia de los latidos y la regularidad general.
- Energy: Normalmente, las pistas energéticas se sienten rápidas y ruidosas. Las características perceptuales que contribuyen a este atributo incluyen el rango dinámico, la sonoridad percibida, el timbre, la velocidad de inicio y la entropía general.
- Instrumentalness: Predice si una pista no contiene voces.
- Liveness: Detecta la presencia de un público en la grabación. Los valores altos representan una mayor probabilidad de que la canción se haya ejecutado en vivo.
- Speechiness: Detecta la presencia de palabras habladas en una pista. Cuanto más existe exclusivamente habla (por ejemplo, talk show, audiolibro, poesía), más cerca está de 1.0 el valor del atributo.
- Valence: Las pistas con alta valencia suenan más positivas (por ejemplo, alegre, eufórica), mientras que las pistas con baja valencia suenan más negativas (por ejemplo, triste, deprimido, enojado).

En adición, otro proposito importante de Miekify recae en utilizar la funcionalidad de crear listas de reproduccion (https://developer.spotify.com/web-api/create-playlist/) y popularla con las canciones recomendadas (https://developer.spotify.com/web-api/add-tracks-to-playlist/).

Amazon RDS

La base de datos en utilización es SQL y está planteada en un dominio proporcionado por Amazon RDS. Cuenta con una sola tabla llamada SongFeatures en donde se almacenan los identificadores de canciones junto con sus respectivos atributos de audio (mencionados anteriormente).

Al momento de ingresar las credenciales de una cuenta válida, se realiza una consulta insertando los identificadores de las canciones del usuario y los valores de los atributos a través del servicio Get Audio Features. El propósito de esta funcionalidad es popular la tabla con canciones que más adelante serán tomadas como recomendaciones para otros usuarios. Spotify no cuenta con un servicio para obtener todas las canciones o audios que existen en totalidad.

Se ha elegido SQL por cuestiones de familiaridad, además para utilizar la función ORDER BY  de varias columnas que en este caso serían los atributos de audio de las canciones. Se ordenan de manera descendente y los resultados mantienen una razón persistente, la cual nos ayuda a saber con más precisión qué canciones preferiría el usuario basado en los valores de los atributos obtenidos de sus canciones iniciales. 

Para apoyar el rendimiento de la base de datos, se implementó un índice no clusterizado en la columna designada como la llave primaria. 

Amazon Lambda y API Gateway

Con Amazon Lambda y API Gateway, es posible ejecutar codigo “sin servidor” que procesa informacion recibida desde la aplicación y se comunica con la base de datos. Actualmente contamos con dos funciones Lambda montados sobre API Gateway para su uso desde AngularJS:

- Almacenamiento de canciones (/audiofeatures):  Esta función recibe un token de Spotify, el cual se utiliza para ejecutar el servicio Get Audio Features. Después, almacena los resultados (valores de los atributos más los identificadores de canciones) en la tabla SongFeatures para su posterior lectura.
- Algoritmo analítico de recomendación (/miekify): Esta función recibe el JSON resultante del servicio Get Audio Features sobre la cuenta de un usuario y realiza las siguientes tareas:
  - Extrae los atributos que se necesitan analizar (Id, Acousticness, Danceability, Energy,  Instrumentalness, Liveness, Speechiness, Valence)
  - Cada valor individual es sumado a un total para cada atributo. Se implementa una colección de datos llave-valor (diccionario), donde la llave es el nombre del atributo y el valor es el total acumulado. A la misma vez, se agregan los identificadores a una lista aparte.
  - Al finalizar la suma, se ordenan las llaves de acuerdo a sus valores de mayor a menor. De esta manera, se obtiene cómo será la instrucción ORDER BY en la consulta a la base de datos. La lista de identificadores construida durante el punto anterior será puesta dentro una instrucción NOT IN. 
  - Se realiza un SELECT TOP X ordenado por la lista de llaves y trae resultados en donde los identificadores no se encuentran dentro de la lista construida a partir del usuario. La instrucción SELECT solo abarca la columna designada para el identificador de la canción.
Regresa el resultado de la consulta como un JSON con una lista conteniendo los identificadores de canciones recomendadas.












