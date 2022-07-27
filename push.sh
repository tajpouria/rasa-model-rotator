#!/bin/bash
docker build . -t tajpouria/rasa-model-rotator:1.0.0

docker push tajpouria/rasa-model-rotator:1.0.0
