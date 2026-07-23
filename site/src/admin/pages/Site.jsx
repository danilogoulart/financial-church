import { useContext, useEffect, useState } from 'react'
import { RoleContext } from '../role'
import {
  createBanner,
  createEvent,
  createPage,
  createPost,
  createStudy,
  deleteBanner,
  deleteEvent,
  deletePage,
  deletePost,
  deleteStudy,
  listBanners,
  listEvents,
  listPages,
  listPosts,
  listStudies,
  siteImageUrl,
  updateBanner,
  updateEvent,
  updatePage,
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
      emptyForm={() => ({ title: '', excerpt: '', body: '', featured: false, cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title, excerpt: r.excerpt || '', body: r.body || '', featured: !!r.featured,
        cover_path: r.cover_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        excerpt: f.excerpt || '',
        body: f.body || '',
        featured: !!f.featured,
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
          <div className="check" style={{ marginTop: 12 }}>
            <input
              id="featured"
              type="checkbox"
              checked={!!f.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            <label htmlFor="featured" style={{ margin: 0 }}>Destaque no carrossel</label>
          </div>
        </>
      )}
      renderCells={(r) => (
        <td>
          {r.featured ? '⭐ ' : ''}{r.title}
          <br />
          <small>/{r.slug}</small>
        </td>
      )}
    />
  )
}

// ---------- Eventos ----------

const REC_LABEL = {
  none: 'Data única',
  daily: 'Vários dias seguidos',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal'
}
const startLabel = (rec) =>
  rec === 'daily' ? 'Primeiro dia e horário'
  : rec === 'weekly' || rec === 'biweekly' ? 'Primeira ocorrência (define o dia da semana e o horário)'
  : rec === 'monthly' ? 'Primeira ocorrência (define o dia do mês e o horário)'
  : 'Data e horário'

export function SiteEvents() {
  return (
    <CrudPage
      icon="📅"
      title="Eventos"
      head={['Evento', 'Quando', 'Tipo']}
      api={{ list: listEvents, create: createEvent, update: updateEvent, remove: deleteEvent }}
      emptyForm={() => ({ title: '', slug: '', excerpt: '', description: '', location: '', recurrence: 'none', monthly_by: 'day', starts_at: '', ends_at: '', repeat_until: '', featured: false, cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title, slug: r.slug || '', excerpt: r.excerpt || '', description: r.description || '', location: r.location || '',
        recurrence: r.recurrence || 'none', monthly_by: r.monthly_by || 'day',
        starts_at: isoToLocalInput(r.starts_at), ends_at: isoToLocalInput(r.ends_at),
        repeat_until: r.repeat_until || '', featured: !!r.featured,
        cover_path: r.cover_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        slug: f.slug || '',
        excerpt: f.excerpt || '',
        description: f.description || '',
        location: f.location || '',
        recurrence: f.recurrence || 'none',
        monthly_by: f.recurrence === 'monthly' ? (f.monthly_by || 'day') : 'day',
        starts_at: localInputToIso(f.starts_at),
        ends_at: f.recurrence === 'none' ? localInputToIso(f.ends_at) : null,
        repeat_until: f.recurrence !== 'none' ? (f.repeat_until || null) : null,
        featured: !!f.featured,
        cover_path: await resolveCover(f, 'events/'),
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <label>Título</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} required />

          <label>Link (slug) <small>(vazio = gerado do título)</small></label>
          <input value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="tarde-do-efata" />

          <label>Tipo de evento</label>
          <select value={f.recurrence} onChange={(e) => set('recurrence', e.target.value)}>
            <option value="none">Data única</option>
            <option value="daily">Vários dias seguidos (ex.: congresso)</option>
            <option value="weekly">Semanal (ex.: campanha)</option>
            <option value="biweekly">Quinzenal (a cada 2 semanas)</option>
            <option value="monthly">Mensal (ex.: Santa Ceia)</option>
          </select>

          {f.recurrence === 'monthly' && (
            <>
              <label>Repetição mensal</label>
              <select value={f.monthly_by} onChange={(e) => set('monthly_by', e.target.value)}>
                <option value="weekday">No mesmo dia da semana (ex.: 1º domingo)</option>
                <option value="day">No mesmo dia do mês (ex.: dia 5)</option>
              </select>
              <small style={{ display: 'block', marginTop: -8, marginBottom: 12 }}>
                A posição (1º, 2º…) e o dia da semana vêm da data da 1ª ocorrência abaixo.
              </small>
            </>
          )}

          <div className="row">
            <div>
              <label>{startLabel(f.recurrence)}</label>
              <input type="datetime-local" value={f.starts_at} onChange={(e) => set('starts_at', e.target.value)} required />
            </div>
            {f.recurrence === 'none' ? (
              <div>
                <label>Fim <small>(opcional)</small></label>
                <input type="datetime-local" value={f.ends_at} onChange={(e) => set('ends_at', e.target.value)} />
              </div>
            ) : (
              <div>
                <label>{f.recurrence === 'daily' ? 'Último dia' : 'Repetir até'}</label>
                <input type="date" value={f.repeat_until} onChange={(e) => set('repeat_until', e.target.value)} />
              </div>
            )}
          </div>

          <label>Local</label>
          <input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Ex.: Templo sede" />
          <label>Resumo <small>(aparece na listagem)</small></label>
          <textarea rows={2} value={f.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          <label>Descrição completa <small>(aparece na página do evento)</small></label>
          <textarea rows={6} value={f.description} onChange={(e) => set('description', e.target.value)} />
          <CoverField form={f} setField={set} />
          <div className="check" style={{ marginTop: 12 }}>
            <input
              id="ev_featured"
              type="checkbox"
              checked={!!f.featured}
              onChange={(e) => set('featured', e.target.checked)}
            />
            <label htmlFor="ev_featured" style={{ margin: 0 }}>Destaque no carrossel</label>
          </div>
        </>
      )}
      renderCells={(r) => (
        <>
          <td>{r.featured ? '⭐ ' : ''}{r.title}<br /><small>/{r.slug}</small></td>
          <td>{fmtDateTime(r.starts_at)}</td>
          <td>{REC_LABEL[r.recurrence] || 'Data única'}</td>
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

// ---------- Banners (cultos) ----------

export function SiteCarousel() {
  return (
    <CrudPage
      icon="🎠"
      title="Carrossel"
      head={['Banner']}
      api={{ list: listBanners, create: createBanner, update: updateBanner, remove: deleteBanner }}
      emptyForm={() => ({ title: '', subtitle: '', link_url: '', sort: 0, cover_path: null, published: false, _coverFile: null, _coverPreview: null })}
      toForm={(r) => ({
        title: r.title || '', subtitle: r.subtitle || '', link_url: r.link_url || '', sort: r.sort || 0,
        cover_path: r.image_path, published: r.published, _coverFile: null, _coverPreview: null
      })}
      fromForm={async (f) => ({
        title: f.title || '',
        subtitle: f.subtitle || '',
        link_url: f.link_url || '',
        sort: Number(f.sort) || 0,
        image_path: await resolveCover(f, 'banners/'),
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 0 }}>
            Slides manuais do carrossel. As notícias em destaque e os próximos eventos
            entram no carrossel automaticamente.
          </p>
          <label>Imagem <small>(paisagem, ex.: 1600×900)</small></label>
          <CoverField form={f} setField={set} />
          <label>Título <small>(opcional)</small></label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Bem-vindo" />
          <label>Subtítulo <small>(opcional)</small></label>
          <input value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="Texto de apoio" />
          <label>Link ao clicar <small>(opcional)</small></label>
          <input value={f.link_url} onChange={(e) => set('link_url', e.target.value)} placeholder="https://... ou /eventos" />
          <label>Ordem <small>(menor aparece primeiro)</small></label>
          <input type="number" value={f.sort} onChange={(e) => set('sort', e.target.value)} />
        </>
      )}
      renderCells={(r) => (
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {r.image_path && (
              <img
                src={siteImageUrl(r.image_path)}
                alt=""
                style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6 }}
              />
            )}
            <span>{r.title || '(sem título)'}</span>
          </div>
        </td>
      )}
    />
  )
}

// ---------- Páginas institucionais ----------

export function SitePages() {
  return (
    <CrudPage
      icon="📄"
      title="Páginas"
      head={['Página', 'No menu']}
      api={{ list: listPages, create: createPage, update: updatePage, remove: deletePage }}
      emptyForm={() => ({ title: '', slug: '', content: '', show_in_menu: false, sort: 0, published: false })}
      toForm={(r) => ({
        title: r.title, slug: r.slug, content: r.content || '',
        show_in_menu: r.show_in_menu, sort: r.sort || 0, published: r.published
      })}
      fromForm={async (f) => ({
        title: f.title.trim(),
        slug: f.slug || '',
        content: f.content || '',
        show_in_menu: !!f.show_in_menu,
        sort: Number(f.sort) || 0,
        published: !!f.published
      })}
      renderFields={(f, set) => (
        <>
          <label>Título</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} required />
          <label>Link (slug) <small>(vazio = gerado do título)</small></label>
          <input value={f.slug} onChange={(e) => set('slug', e.target.value)} placeholder="quem-somos" />
          <label>Conteúdo</label>
          <textarea rows={10} value={f.content} onChange={(e) => set('content', e.target.value)} />
          <label>Ordem no menu</label>
          <input type="number" value={f.sort} onChange={(e) => set('sort', e.target.value)} />
          <div className="check">
            <input
              id="show_in_menu"
              type="checkbox"
              checked={!!f.show_in_menu}
              onChange={(e) => set('show_in_menu', e.target.checked)}
            />
            <label htmlFor="show_in_menu" style={{ margin: 0 }}>Mostrar no menu do site</label>
          </div>
        </>
      )}
      renderCells={(r) => (
        <>
          <td>{r.title}<br /><small>/{r.slug}</small></td>
          <td>{r.show_in_menu ? 'sim' : '—'}</td>
        </>
      )}
    />
  )
}
