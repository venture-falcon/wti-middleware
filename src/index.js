const axios = require('axios')
const NodeCache = require('node-cache')

const PROJECT_CACHE_TTL = 60 * 60 * 24 // 24 Hours
const LANGUAGE_CACHE_TTL = 60 * 10 // 10 Minutes

const cache = new NodeCache({ checkperiod: 240, deleteOnExpire: false })

const httpClient = axios.create({
  baseURL: 'https://webtranslateit.com/api/projects',
  timeout: 1000
})

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

module.exports = projectToken => {
  cache.on('expired', (key, value) => {
    const locale = key.split('WTI::TRANSLATIONS::')[1]
    const data = fetchData(projectToken, locale)
    cache.set(key, data, LANGUAGE_CACHE_TTL)
  })

  return async (req, res, next) => {
    const { wti_locale: locale } = req.headers
    const key = `WTI::TRANSLATIONS::${locale}`

    let data
    const cachedVal = await cache.get(key)

    if (!cachedVal) {
      data = await fetchData(projectToken, locale)
      cache.set(key, data, LANGUAGE_CACHE_TTL)
    }

    req.translations = cachedVal || data

    next()
  }
}
