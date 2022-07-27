# RASA Model Rotator

It watches for RASA model directory changes, copies the latest model with a specific name, and deletes the rest of the models.

## Why tho?

I was using the [RASA Train a Model API](https://rasa.com/docs/rasa/pages/http-api/#operation/trainModel) and decided to put this script together for the following reasons:
First of all at the time of writing this script the RASA train the model API doesn't replace the latest model automatically and to replace it the [RASA Replace a Model API](https://rasa.com/docs/rasa/pages/http-api/#operation/replaceModel) needed to be called which requires the model path which would be a randomly generated name after running the trainings.
And second the models directory persisting the previous models thus it keep growing and occupies a lot of space.

## Usage

### With Kubernetes:

Create a shared [volume](https://kubernetes.io/docs/concepts/storage/volumes) for models and mount it to both RASA-OS and model rotator containers. Make sure volume access mode is set to `ReadWriteMany`, so both containers able to do required operations.
Then deploy the Pods like following example:

```yml
# models.pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: models-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 100M

# rasa.pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: rasa
spec:
  containers:
  - image: rasa/rasa:latest
    volumeMounts:
      - mountPath: /app/models
        name: models
  securityContext:
    fsGroup: 2000 # Allows processes to write to mounted volumes.
  volumes:
    - name: models
      persistentVolumeClaim:
        claimName: models-pvc

# rasa-log-rotator.pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: rasa-log-rotator
spec:
  containers:
  - image: tajpouria/rasa-model-rotator:latest
    volumeMounts:
      - mountPath: /app/models
        name: models
  securityContext:
    fsGroup: 2000 # Allows processes to write to mounted volumes.
  volumes:
    - name: models
      persistentVolumeClaim:
        claimName: models-pvc
```

## Environment Variables

- `TARGET_DIR`: Model directory to watch for changes. default: "models".
- `LATEST_MODEL_PATH`: Where to copy the latest trained model. default: "models/latest.tar.gz".
- `THROTTLE_DELAY`: How many milliseconds to wait before copying the latest model. It's need because Rasa writes the model gradually. default "5000".
