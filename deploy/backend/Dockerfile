FROM eclipse-temurin:8-jre

WORKDIR /app

# 时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# JVM 参数可在启动时覆盖
ENV JAVA_OPTS="-Xms256m -Xmx512m"

COPY app.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dspring.profiles.active=prod -jar /app/app.jar"]
