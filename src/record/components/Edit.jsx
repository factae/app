import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Button from 'antd/es/button'
import Form from 'antd/es/form'
import Icon from 'antd/es/icon'
import InputNumber from 'antd/es/input-number'
import Popconfirm from 'antd/es/popconfirm'
import Select from 'antd/es/select'
import find from 'lodash/fp/find'

import Container from '../../common/components/Container'
import Title from '../../common/components/Title'
import FormCard, {FormCardTitle, validateFields} from '../../common/components/FormCard'
import AutoCompleteClients from '../../common/components/AutoCompleteClients'
import DatePicker from '../../common/components/DatePicker'
import AutoCompleteNature from '../../common/components/AutoCompleteNature'
import AutoCompletePaymentMethod from '../../common/components/AutoCompletePaymentMethod'
import AutoCompleteReference from '../../common/components/AutoCompleteReference'
import {useNotification} from '../../utils/notification'
import {useClients} from '../../client/hooks'
import {useRecords} from '../hooks'
import $record from '../service'

function EditRecord(props) {
  const {form} = props
  const clients = useClients()
  const records = useRecords()
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState(props.location.state)
  const tryAndNotify = useNotification()
  const {t} = useTranslation()
  const requiredRules = {rules: [{required: true, message: t('field-required')}]}

  useEffect(() => {
    if (records && !record) {
      setRecord(find({id: props.match.params.id}, records))
    }
  }, [record, records, props.match.params.id])

  async function deleteRecord() {
    await tryAndNotify(
      async () => {
        setLoading(true)
        await $record.delete(record)
        props.history.push('/records')
        return t('/records.deleted-successfully')
      },
      () => setLoading(false),
    )
  }

  async function saveRecord(event) {
    event.preventDefault()
    if (loading) return
    setLoading(true)

    await tryAndNotify(async () => {
      let nextRecord = await validateFields(form)
      nextRecord.id = record.id
      nextRecord.createdAt = nextRecord.createdAt.toISOString()
      setRecord(nextRecord)
      await $record.set(nextRecord)
      return t('/records.updated-successfully')
    })

    setLoading(false)
  }

  if (!records || !record || !clients) {
    return null
  }

  const mainFields = {
    title: <FormCardTitle title="general-informations" />,
    fields: [
      {name: 'createdAt', Component: <DatePicker autoFocus />, ...requiredRules},
      {
        name: 'type',
        Component: (
          <Select size="large" style={{width: '100%'}}>
            {['revenue', 'purchase'].map(type => (
              <Select.Option key={type} value={type}>
                {t(type)}
              </Select.Option>
            ))}
          </Select>
        ),
        ...requiredRules,
      },
      {
        name: 'client',
        Component: <AutoCompleteClients />,
        ...requiredRules,
      },
      {
        name: 'reference',
        Component: <AutoCompleteReference types={['invoice', 'credit']} />,
        ...requiredRules,
      },
      {
        name: 'nature',
        Component: <AutoCompleteNature />,
        ...requiredRules,
      },
      {
        name: 'paymentMethod',
        Component: <AutoCompletePaymentMethod />,
        ...requiredRules,
      },
    ],
  }

  const totalFields = {
    title: <FormCardTitle title="amounts" />,
    fields: [
      {
        name: 'totalHT',
        Component: <InputNumber size="large" step={1} style={{width: '100%'}} />,
        ...requiredRules,
      },
      {
        name: 'totalTVA',
        Component: <InputNumber size="large" step={1} style={{width: '100%'}} />,
      },
      {
        name: 'totalTTC',
        Component: <InputNumber size="large" step={1} style={{width: '100%'}} />,
      },
    ],
  }

  const fields = [mainFields, totalFields]

  return (
    <Container>
      <Form noValidate layout="vertical" onSubmit={saveRecord}>
        <Title label="record">
          <Button.Group>
            <Popconfirm
              title={t('/records.confirm-deletion')}
              onConfirm={deleteRecord}
              okText={t('yes')}
              cancelText={t('no')}
            >
              <Button type="danger" disabled={loading}>
                <Icon type="delete" />
                {t('delete')}
              </Button>
            </Popconfirm>

            <Button type="primary" htmlType="submit" disabled={loading}>
              <Icon type={loading ? 'loading' : 'save'} />
              {t('save')}
            </Button>
          </Button.Group>
        </Title>

        {fields.map((props, key) => (
          <FormCard key={key} form={form} model={record} {...props} />
        ))}
      </Form>
    </Container>
  )
}

export default Form.create()(EditRecord)
