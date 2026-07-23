import { useContext, useEffect, useState } from 'react'
import { RoleContext } from '../role'
import {
  createEvent,
  createPost,
  createStudy,
  deleteEvent,
  deletePost,
  deleteStudy,
  listEvents,
  listPosts,
  listStudies,
  siteImageUrl,
  updateEvent,
  updatePost,
  updateStudy,
  uploadSiteImage
} from '../api'

// ---------- helpers ----------

function isoToLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}
const localInputToIso = (v) => (v ? new Date(v).toISOString() : null)

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

// Campo de capa (upload para o bucket público 'site' com pré-visualização).
function CoverField({ form, setField }) {
  const url = form._coverPreview || siteImageUrl(form.cover_path)
  return (
    <div>
      <label>Imagem de capa</label>
      {url && (
        <img
          src={url}
          alt=""
          style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, display: 'block', marginBottom: 8 }}
        />
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0] || null
          setField('_coverFile', file)
          setField('_coverPreview', file ? URL.createObjectURL(file) : null)
        }}
      />
    </div>
  )
}

// Sobe a capa (se houver arquivo novo) e devolve o caminho a gravar.
async function resolveCover(form, prefix) {
  if (form._coverFile) return uploadSiteImage(form._coverFile, prefix)
  return form.cover_path || null
}

// ---------- CRUD genérico ----------

function CrudPage({ icon, title, api, head, emptyForm, toForm, fromForm, renderFields, renderCells }) {
  const { canEditSite } = useContext(RoleContext)
  const [rows, setRows] = useState(null)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState(null)

  async function load() {
    try {
      setRows(await api.list())
    } catch (e) {
      setBanner({ type: 'err', msg: e.message })
    }
  }
  useEffect(() => {
    load()
  }, [])

  const setField = (k, v) => setEditing((f) => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    setBanner(null)
    try {
      const payload = await fromForm(editing)
      if (editing.id) await api.update(editing.id, payload)
      else await api.create(payload)
      setEditing(null)
      await load()
      setBanner({ type: 'ok', msg: 'Salvo com sucesso.' })
    } catch (err) {
      setBanner({ type: 'err', msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function togglePublish(row) {
    setBanner(null)
    try {
      await api.update(row.id, { published: !row.published })
      await load()
    } catch (e) {
      setBanner({ type: 'err', msg: e.message })
    }
  }

  async function remove(row) {
    if (!window.confirm(`Excluir "${row.title}"? Essa ação não pode ser desfeita.`)) return
    setBanner(null)
    try {
      await api.remove(row.id)
      await load()
    } catch (e) {
      setBanner({ type: 'err', msg: e.message })
    }
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>
            {icon} {title}
          </h2>
          {canEditSite && !editing && (
            <button className="link-btn" onClick={() => { setEditing({ ...emptyForm() }); setBanner(null) }}>
              + Novo
            </button>
          )}
        </div>
        {banner && <div className={`banner ${banner.type}`} style={{ marginTop: 12 }}>{banner.msg}</div>}
        {!canEditSite && (
          <small>Você tem acesso de leitura. A edição do site é feita por admin/editor.</small>
        )}
      </div>

      {editing && (
        <form className="card" onSubmit={save}>
          <h2>{editing.id ? 'Editar' : 'Novo'}</h2>
          {renderFields(editing, setField)}
          <div className="check">
            <input
              id="published"
              type="checkbox"
              checked={!!editing.published}
              onChange={(e) => setField('published', e.target.checked)}
            />
            <label htmlFor="published" style={{ margin: 0 }}>Publicado (aparece no site)</label>
          </div>
          <button className="primary" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            className="link-btn"
            style={{ display: 'block', marginTop: 10 }}
            onClick={() => setEditing(null)}
          >
            Cancelar
          </button>
        </form>
      )}

      <div className="card">
        {rows === null ? (
          <span style={{ color: '#999' }}>Carregando...</span>
        ) : rows.length === 0 ? (
          <span style={{ color: '#999' }}>Nada cadastrado ainda.</span>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {head.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                  <th>Status</th>
                  {canEditSite && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {renderCells(row)}
                    <td>
                      {row.published ? (
                        <span className="pill ok">publicado</span>
                      ) : (
                        <span className="pill warn">rascunho</span>
                      )}
                    </td>
                    {canEditSite && (
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="link-btn" onClick={() => { setEditing({ id: row.id, ...toForm(row) }); setBanner(null) }}>
                          editar
                        </button>
                        {' · '}
                        <button className="link-btn" onClick={() => togglePublish(row)}>
                          {row.published ? 'despublicar' : 'publicar'}
                        </button>
                        {' · '}
                        <button className="link-btn" onClick={() => remove(row)}>excluir</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

// ---------- Notícias ----------

export function SitePosts() {
  return (
    <CrudPage
      icon="📰"
      title="Notícias"
      head={['Título']}
      api={{ list: listPosts, create: createPost, update: updatePost, remove: deletePost }}
      emptyForm={() => ({ title: '', excerpt: '', body: '', cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title, excerpt: r.excerpt || '', body: r.body || '',
        cover_path: r.cover_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        excerpt: f.excerpt || '',
        body: f.body || '',
        cover_path: await resolveCover(f, 'posts/'),
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <label>Título</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} required />
          <label>Resumo <small>(aparece na listagem do site)</small></label>
          <textarea rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          <label>Texto</label>
          <textarea rows={8} value={f.body} onChange={(e) => set('body', e.target.value)} />
          <CoverField form={f} setField={set} />
        </>
      )}
      renderCells={(r) => (
        <td>
          {r.title}
          <br />
          <small>/{r.slug}</small>
        </td>
      )}
    />
  )
}

// ---------- Eventos ----------

export function SiteEvents() {
  return (
    <CrudPage
      icon="📅"
      title="Eventos"
      head={['Evento', 'Quando', 'Local']}
      api={{ list: listEvents, create: createEvent, update: updateEvent, remove: deleteEvent }}
      emptyForm={() => ({ title: '', description: '', location: '', starts_at: '', ends_at: '', cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title, description: r.description || '', location: r.location || '',
        starts_at: isoToLocalInput(r.starts_at), ends_at: isoToLocalInput(r.ends_at),
        cover_path: r.cover_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        description: f.description || '',
        location: f.location || '',
        starts_at: localInputToIso(f.starts_at),
        ends_at: localInputToIso(f.ends_at),
        cover_path: await resolveCover(f, 'events/'),
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <label>Título</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} required />
          <div className="row">
            <div>
              <label>Início</label>
              <input type="datetime-local" value={f.starts_at} onChange={(e) => set('starts_at', e.target.value)} required />
            </div>
            <div>
              <label>Fim <small>(opcional)</small></label>
              <input type="datetime-local" value={f.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
            </div>
          </div>
          <label>Local</label>
          <input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Ex.: Templo sede" />
          <label>Descrição</label>
          <textarea rows={5} value={f.description} onChange={(e) => set('description', e.target.value)} />
          <CoverField form={f} setField={set} />
        </>
      )}
      renderCells={(r) => (
        <>
          <td>{r.title}</td>
          <td>{fmtDateTime(r.starts_at)}</td>
          <td>{r.location || '—'}</td>
        </>
      )}
    />
  )
}

// ---------- Estudos bíblicos ----------

export function SiteStudies() {
  return (
    <CrudPage
      icon="📖"
      title="Estudos Bíblicos"
      head={['Estudo', 'Ministrante', 'Data']}
      api={{ list: listStudies, create: createStudy, update: updateStudy, remove: deleteStudy }}
      emptyForm={() => ({ title: '', teacher: '', reference: '', studied_on: '', video_url: '', description: '', cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title, teacher: r.teacher || '', reference: r.reference || '',
        studied_on: r.studied_on || '', video_url: r.video_url || '', description: r.description || '',
        cover_path: r.cover_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        teacher: f.teacher || '',
        reference: f.reference || '',
        studied_on: f.studied_on || null,
        video_url: f.video_url || '',
        description: f.description || '',
        cover_path: await resolveCover(f, 'studies/'),
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <label>Tema</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} required />
          <div className="row">
            <div>
              <label>Ministrante</label>
              <input value={f.teacher} onChange={(e) => set('teacher', e.target.value)} placeholder="Ex.: Pr. João" />
            </div>
            <div>
              <label>Passagem</label>
              <input value={f.reference} onChange={(e) => set('reference', e.target.value)} placeholder="Ex.: João 3.16" />
            </div>
          </div>
          <label>Data</label>
          <input type="date" value={f.studied_on} onChange={(e) => set('studied_on', e.target.value)} />
          <label>Link do vídeo <small>(YouTube/Vimeo)</small></label>
          <input value={f.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://..." />
          <label>Descrição</label>
          <textarea rows={5} value={f.description} onChange={(e) => set('description', e.target.value)} />
          <CoverField form={f} setField={set} />
        </>
      )}
      renderCells={(r) => (
        <>
          <td>{r.title}</td>
          <td>{r.teacher || '—'}</td>
          <td>{fmtDate(r.studied_on)}</td>
        </>
      )}
    />
  )
}
