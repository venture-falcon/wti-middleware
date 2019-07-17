const { expect } = require('chai')
const nock = require('nock')

const wti = require('./index')

const project = {
  project: {
    project_files: [
      {
        locale_code: 'en-US',
        master_project_file_id: '1'
      }
    ]
  }
}
const translation = { foo: 'bar' }

describe('WTI Middleware', () => {
  beforeEach(() => {
    nock('https://webtranslateit.com/api/projects')
      .get('/token')
      .reply(200, project)
      .get('/token/files/1/locales/en-US')
      .reply(200, translation)
  })

  it('Request with locale', async () => {
    const req = { headers: { wti_locale: 'en-US' }, path: '/' }
    await wti({ projectToken: 'token' })(req, {}, () => {})

    expect(req.translations.foo).to.equal('bar')
  })

  it('As plain function', async () => {
    const translations = await wti({
      projectToken: 'token',
      plainFunction: true
    })('en-US')

    expect(translations.foo).to.equal('bar')
  })
})
