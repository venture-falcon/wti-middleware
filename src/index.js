const axios = require('axios')
const NodeCache = require('node-cache')

const cache = new NodeCache({ checkperiod: 240, deleteOnExpire: false })
const httpClient = axios.create({
  baseURL: 'https://webtranslateit.com/api/projects',
  timeout: 1000
})

const PROJECT_CACHE_TTL = 60 * 60 * 24 // 24 Hours
const LANGUAGE_CACHE_TTL = 60 * 10 // 10 Minutes

const getProject = async token => {
  const key = 'WTI::TRANSLATIONS::PROJECT'
  let cProject = await cache.get(key)
  if (!cProject) {
    try {
      const response = await httpClient.get(`/${token}`)

      const {
        data: { project }
      } = response

      cache.set(key, project, PROJECT_CACHE_TTL)
      cProject = project
    } catch (e) {
      console.log('Could not fetch WTI project')
    }
  }

  return cProject
}

const fetchTranslation = async (token, file) => {
  const { master_project_file_id: masterId, locale_code: locale, id } = file
  const fileId = masterId || id
  let translation = {}

  try {
    const response = await httpClient.get(
      `/${token}/files/${fileId}/locales/${locale}`
    )

    translation = response.data
  } catch (e) {
    console.log('Could not fetch WTI translation for', locale)
  }

  return translation
}

const fetchData = async (token, locale) => {
  const { project_files: files } = await getProject(token)

  const file =
    files.find(f => f.locale_code === locale) ||
    files.find(f => f.locale_code === 'en')

  const translation = await fetchTranslation(token, file)

  return translation
}

module.exports = projectToken => async (req, res, next) => {
  const { wti_locale: locale } = req.headers
  const key = `WTI::TRANSLATIONS::${locale}`

  let data
  const cachedVal = await cache.get(key)

  if (!cachedVal) {
    data = await fetchData(projectToken, locale)
    cache.set(key, data, LANGUAGE_CACHE_TTL)
  } else {
    const ttl = cache.getTtl(key)
    // check for key expiry
    if (typeof ttl === 'undefined' || ttl === 0) {
      fetchData(projectToken, locale).then(newData => {
        console.log('fetched new data', Object.keys(newData))
        cache.set(key, newData, LANGUAGE_CACHE_TTL)
      })
    }
  }

  req.translations = cachedVal || data

  next()
}
