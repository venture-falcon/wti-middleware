# WTI-middleware

Fetch translations from your webTranslate it project into your app

## Usage

### V 2
From version 2 you can return a plain function which takes the locale as an argument
  breaking changes
  wti function now takes an object with properties instead of a list of arguments

```javascript
// as middleware
import wti from 'wti-middleware'
const middleware = wti({
  projectToken: 'WTI_PROJECT_KEY',
  ttl: 60*5 // in seconds, optional
  plainFunction: false // return plain function, optinal
})

app.use((req, res, next) => {
  req.headers.wti_locale = 'en-US'
  next()
})

app.use(middleware)

// as plain function
import wti from 'wti-middleware'
const fun = wti({
  projectToken: 'WTI_PROJECT_KEY',
  plainFunction: true // return plain function, optinal
})

const translations = await fun('en-US')
```

### V 1.X
This middleware needs a request header with the current locale to work properly

The middleware factory function takes 2 parameters, your WTI read key and an optional TTL in seconds for cache

```javascript
import wti from 'wti-middleware'
const middleware = wti('WTI_READ_KEY')

app.use((req, res, next) => {
  req.headers.wti_locale = 'en-US'
  next()
})
app.use(middleware)
```

The middleware will add a translation property to your request object
```javascript
...
app.use(middleware)
app.use((req, res, next) => {
  const { translations } = req
  // do stuff
})
```