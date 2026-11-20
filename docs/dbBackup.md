# Database Backup & Restore

## Backup
The backup of the expenses database is simply done by copying all the documents periodically and dumping them in a GCS storage bucket. 

The backup process follows these steps: 

1. Trigger (Cloud Scheduler)
2. For each relevant collection, query the collection and save it on a file on GCS
3. Delete old files

Only the last `x` files are saved on GCS. <br>
The backup should run **every day** during the night. 

The backup happens in the bucket that is provided **as an Environment Variable** (populated at build-time through Github Action and stored as a Github Action Environment Secret) called `BACKUP_BUCKET`. 

## Restore
The restore is exposed **through an API**. <br>

Both `POST /expenses/backup` (the target of the scheduled backup) and `POST /expenses/restore` are `totoms` delegates (`src/dlg/backup/StartBackup.ts` and `StartRestore.ts`) that extend `TotoDelegate` and read the database through the shared client provided by `ControllerConfig.getMongoDb(...)` (from `TotoControllerConfig`).
