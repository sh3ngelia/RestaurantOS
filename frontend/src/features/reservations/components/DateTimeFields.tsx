import { FormField } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fieldDescribedBy } from '@/lib/forms'
import { isDayKey, toDayKey } from '@/lib/dates'
import { timeSlotsFor } from '../validation'

interface DateTimeFieldsProps {
  dateId: string
  timeId: string
  date: string
  time: string
  onDateChange: (date: string, slots: string[]) => void
  onTimeChange: (time: string) => void
  onDateBlur?: () => void
  dateError?: string
  timeError?: string
  now: Date
  /** An existing booking's time, kept selectable even if outside service hours. */
  keepTime?: string
}

/** Native date picker plus 15-minute service slots; past slots are hidden for today. */
export function DateTimeFields({
  dateId,
  timeId,
  date,
  time,
  onDateChange,
  onTimeChange,
  onDateBlur,
  dateError,
  timeError,
  now,
  keepTime,
}: DateTimeFieldsProps) {
  const slots = isDayKey(date) ? timeSlotsFor(date, now, keepTime) : []
  const noSlots = isDayKey(date) && slots.length === 0

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField id={dateId} label="Date" error={dateError}>
        <Input
          id={dateId}
          type="date"
          min={toDayKey(now)}
          value={date}
          onChange={(e) => {
            const next = e.target.value
            onDateChange(next, isDayKey(next) ? timeSlotsFor(next, now, keepTime) : [])
          }}
          onBlur={onDateBlur}
          className="h-12 tabular-nums [color-scheme:inherit]"
          aria-invalid={!!dateError}
          aria-describedby={fieldDescribedBy(dateId, { error: dateError })}
        />
      </FormField>

      <FormField
        id={timeId}
        label="Time"
        error={timeError}
        hint={noSlots ? 'No times left today. Pick another date.' : undefined}
      >
        <Select value={slots.includes(time) ? time : ''} onValueChange={onTimeChange} disabled={slots.length === 0}>
          <SelectTrigger
            id={timeId}
            className="h-12 tabular-nums"
            aria-invalid={!!timeError}
            aria-describedby={fieldDescribedBy(timeId, { error: timeError, hint: noSlots })}
          >
            <SelectValue placeholder={noSlots ? 'No times left' : 'Choose a time'} />
          </SelectTrigger>
          <SelectContent>
            {slots.map((slot) => (
              <SelectItem key={slot} value={slot} className="tabular-nums">
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </div>
  )
}
