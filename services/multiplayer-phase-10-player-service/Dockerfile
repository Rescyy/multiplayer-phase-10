FROM python:3.12.6
RUN apt-get install curl -y
WORKDIR /usr/src/player-service
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
COPY .env.production ./.env
CMD ["python", "src/main.py"]