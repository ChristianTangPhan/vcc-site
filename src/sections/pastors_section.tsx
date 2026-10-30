// Home page "Our Pastors": swipeable row of cards. Editors can edit, add, and delete.
import { useState } from 'react'
import type { Admin, Pastor } from '../types'
import { Editable } from '../components/editable'
import { PastorEditor } from '../editors/pastor_editor'

export function PastorsSection({
  pastors,
  admin,
  onSaved,
}: {
  pastors: Pastor[]
  admin: Admin | null
  onSaved: () => void
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section id="pastors">
      <h2>Our Pastors</h2>

      <div className={`pastor-row ${pastors.length === 1 ? 'single' : ''}`}>
        {pastors.map((p) => (
          <Editable
            key={p.p_id}
            className="pastor-slot"
            canEdit={!!admin}
            editor={(close) => admin && <PastorEditor pastor={p} admin={admin} onSaved={onSaved} onClose={close} />}
          >
            <div className="card pastor-card">
              {p.p_image && <img className="pastor-photo" src={p.p_image} alt={p.p_name} />}
              <h3>{p.p_name}</h3>
              <p><a href={`tel:${p.p_phone_number}`}>{p.p_phone_number}</a></p>
              <p><a href={`mailto:${p.p_email}`}>{p.p_email}</a></p>
            </div>
          </Editable>
        ))}
      </div>
      {pastors.length > 1 && <p className="muted swipe-hint">Swipe to see more →</p>}

      {admin && (adding ? (
        <PastorEditor admin={admin} onSaved={onSaved} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" className="add-btn" onClick={() => setAdding(true)}>
          + Add pastor
        </button>
      ))}
    </section>
  )
}
