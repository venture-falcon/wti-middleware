# WTI-middleware

Fetch translations from your webTranslate it project into your app

## Usage

This middleware needs a request header with the current locale to work properly

```javascript
import wti from 'wti-middleware'
const middleware = wti('WTI_READ_KEY')

app.use((req, res, next) => {
  req.wti_locale = 'en-US'
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