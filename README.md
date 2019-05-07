# WTI-middleware

## Usage

This middleware needs a request header with the current locale to work properly

```javascript
import wti from 'wti-middleware'

app.use((req, res, next) => {
  req.wti_locale = 'en-US'
  next()
})
app.use(wti('WTI_READ_KEY'))
```