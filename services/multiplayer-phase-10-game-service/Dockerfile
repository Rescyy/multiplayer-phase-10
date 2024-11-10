FROM python:3.12.6
RUN apt-get install curl -y
WORKDIR /usr/src/game-service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY .env.production ./.env
COPY src ./src
CMD ["python", "src/main.py"]