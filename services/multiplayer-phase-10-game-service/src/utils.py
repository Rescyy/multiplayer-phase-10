import datetime

def getDateTimeISO():
    return datetime.datetime.now().isoformat()

def getDateTime():
    return datetime.datetime.now()

def toDateTimeISO(dateTime: datetime.datetime):
    return dateTime.isoformat()