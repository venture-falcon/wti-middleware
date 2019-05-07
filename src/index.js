const axios = require('axios')
const NodeCache = require('node-cache')
const { promisify } = require('util')

const cache = new NodeCache({ checkperiod: 240 })
const httpClient = axios.create({
  baseURL: 'https://webtranslateit.com/api/projects',
  timeout: 1000
})

const set = promisify(cache.set)
const get = promisify(cache.get)

const getProject = async token => {
  const key = 'WTI::TRANSLATIONS::PROJECT'
  let cProject = await get(key)
  if (!cProject) {
    try {
      const response = await httpClient.get(`/${token}`)

      const {
        data: { project }
      } = response

      set(key, project, 60 * 60 * 24)
      cProject = project
    } catch (e) {
      // do nothing
    }
  }

  return cProject
}

const fetchTranslation = async (token, file) => {
  const { master_project_file_id: masterId, locale_code, id } = file
  const fileId = masterId || id
  let translation = {}

  try {
    const response = await httpClient.get(
      `/${token}/files/${fileId}/locales/${locale_code}`
    )

    translation = response.data
  } catch (e) {
    // do nothing
  }

  return translation
}

const fetchData = async (token, locale) => {
  const { project_files: files } = await getProject(token)

  const file =
    files.find((f) => f.locale_code === locale) ||
    files.find((f) => f.locale_code === 'en')

  const translation = await fetchTranslation(token, file)
  return translation
}

module.exports = (projectToken) => async (
  req,
  res,
  next
) => {
  const { wti_locale } = req.headers
  const key = 'WTI::TRANSLATIONS::' + wti_locale

  let data
  const cachedVal = await get(key)

  if (!cachedVal) {
    data = await fetchData(projectToken, wti_locale)
    set(key, data, 60 * 30)
  }

  req.translations = cachedVal || data

  next()
}
