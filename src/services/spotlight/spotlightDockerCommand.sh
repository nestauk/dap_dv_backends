docker run -dp 2222:2222 \
     -w /app -v '/home/ubuntu:/app' \
     --memory=10g \
     openjdk:8-jre-alpine \
     sh -c 'java -Dfile.encoding=UTF-8 -Xmx10G -jar dbpedia-spotlight-1.1.jar en http://0.0.0.0:2222/rest'
