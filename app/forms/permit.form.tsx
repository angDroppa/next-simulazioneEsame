// components/permit-form.tsx
'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreatePermitSchema, CreatePermit, Permit } from '@/lib/schemas/permit.schema'
import { permitApi } from '@/lib/axios/permit'
import { permitCategoryApi, PermitCategory } from '@/lib/axios/permit-category'
import toast from 'react-hot-toast'

interface PermitFormProps {
  onSuccess: (permit: Permit) => void
  defaultValues?: Permit
}

export default function PermitForm({ onSuccess, defaultValues }: PermitFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<PermitCategory[]>([])
  const isEdit = !!defaultValues

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePermit>({
    resolver: zodResolver(CreatePermitSchema),
  })

  useEffect(() => {
    permitCategoryApi.getAll().then((cats) => {
      setCategories(cats)
      if (defaultValues) {
        reset({
          startDate: new Date(defaultValues.startDate).toISOString().split('T')[0],
          endDate: new Date(defaultValues.endDate).toISOString().split('T')[0],
          categoryId: defaultValues.categoryId,
          motivation: defaultValues.motivation,
        })
      }
    }).catch(() => {})
  }, [defaultValues, reset])

  const onSubmit = async (data: CreatePermit) => {
    try {
      setLoading(true)
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      }
      const permit = isEdit
        ? await permitApi.update(defaultValues!.id, payload)
        : await permitApi.create(payload)
      toast.success(isEdit ? 'Permit modificato con successo' : 'Permit creato con successo')
      reset()
      onSuccess(permit)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Data inizio</legend>
        <input type="date" className="input w-full" {...register('startDate')} />
        {errors.startDate && <p className="label text-error">{errors.startDate.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Data fine</legend>
        <input type="date" className="input w-full" {...register('endDate')} />
        {errors.endDate && <p className="label text-error">{errors.endDate.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Categoria</legend>
        <select className="select w-full" {...register('categoryId')}>
          <option value="">Seleziona una categoria</option>
          {categories.map((cat) => (
            <option key={cat.categoryName} value={cat.categoryName}>
              {cat.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="label text-error">{errors.categoryId.message}</p>}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Motivazione</legend>
        <textarea
          className="textarea w-full"
          placeholder="Descrivi il motivo della richiesta"
          {...register('motivation')}
        />
        {errors.motivation && <p className="label text-error">{errors.motivation.message}</p>}
      </fieldset>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="loading loading-spinner loading-sm" />}
          {isEdit ? 'Salva modifiche' : 'Crea permit'}
        </button>
      </div>

    </form>
  )
}