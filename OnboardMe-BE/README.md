# ProyectoFinal

Paso a paso del docker image: 

1) docker login
2) Pide token (preguntar por el)
3) docker build -t orneefas/onboardme-be:latest . ---> (buildea la imagen para pushearla al repo)
4) docker push orneefas/onboardme-be:latest   ---> (Pushea al repo)
5) docker-compose down --> Baja la app de docker
6) docker-compose pull --> Te trae los ultimos cambios que acabas de pushear
7) docker rm onboardme-be   ---> Elimina el container que esta repetido
8) docker-compose up -d ---> Levanta el container


docker pull orneefas/onboardme-be:latest -- -> Trae la ultima imagen


RUN: docker run -d --name onboardme-be -p 8080:8080 orneefas/onboardme-be:latest
