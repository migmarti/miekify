import json
import pymssql

server = 'cc414-miekify-db.c6aodczcoukl.us-east-1.rds.amazonaws.com:8888'
user = 'miekify'
password = 'password1'
db = 'MiekifyDB'

def getSongIds(idString, sortString, qty):
    query = 'SELECT TOP ' + str(qty) + ' SongId FROM SongFeatures ' + 'WHERE SongId NOT IN (' + idString + ') ' + 'ORDER BY ' + sortString
    conn = pymssql.connect(server=server, user=user, password=password, database=db)
    cursor = conn.cursor()
    cursor.execute(query)
    fetch = cursor.fetchall()
    results = []
    for i in range(0, len(fetch)):
        results.append(fetch[i][0])
    idJson = json.dumps(results)
    conn.close()
    return idJson

def handler(event, context):
    data = event
    ids = []
    values = {}
    values['acousticness'] = 0
    values['danceability'] = 0
    values['energy'] = 0
    values['instrumentalness'] = 0
    values['liveness'] = 0
    values['speechiness'] = 0
    values['valence'] = 0
    for i in range(len(data)):
        ids.append(data[i]['id'])
        values['acousticness'] += data[i]['acousticness']
        values['danceability'] += data[i]['danceability']
        values['energy'] += data[i]['energy']
        values['instrumentalness'] += data[i]['instrumentalness']
        values['liveness'] += data[i]['liveness']
        values['speechiness'] += data[i]['speechiness']
        values['valence'] += data[i]['valence']
    sortedValues = sorted(values, key=values.get, reverse=True)
    sortString = ''
    idString = ''
    for i in ids:
        idString += ", '" + i + "'"
    idString = idString.replace(', ', '', 1)
    for v in sortedValues:
        sortString += ", " + v + " DESC"
    sortString = sortString.replace(', ','',1)
    idJson = getSongIds(idString, sortString, 10)
    return idJson