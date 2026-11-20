import type { JobCard } from '../nlp'
import { VEHICLE_LABEL } from '../ui/format'

/** Plain-text job card for WhatsApp / SMS sharing. */
export function jobCardText(c: JobCard): string {
  const line = (k: string, v: string) => (v.trim() ? `${k}: ${v.trim()}` : null)
  const parts = c.parts.filter((p) => p.name.trim())
  return [
    'Job card — Thalia',
    line('Vehicle', [VEHICLE_LABEL[c.vehicle.type], c.vehicle.name].filter(Boolean).join(' · ')),
    line('Reg. no.', c.vehicle.regNo),
    line('Customer', c.vehicle.customer),
    line('Service', c.vehicle.service),
    line('Complaint', c.complaint),
    line('Diagnosis', c.diagnosis),
    c.work.length ? ['Work done:', ...c.work.map((w) => `${w.done ? '[x]' : '[ ]'} ${w.text}`)].join('\n') : null,
    parts.length ? ['Parts:', ...parts.map((p) => `- ${p.name}${p.qty ? ` × ${p.qty}` : ''}${p.price ? ` · ₹${p.price}` : ''}`)].join('\n') : null,
    line('Labour', c.labour ? `₹${c.labour}` : ''),
  ].filter(Boolean).join('\n')
}
