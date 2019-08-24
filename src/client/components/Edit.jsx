import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import Button from 'antd/es/button'
import Form from 'antd/es/form'
import Icon from 'antd/es/icon'
import Input from 'antd/es/input'
import Popconfirm from 'antd/es/popconfirm'
import find from 'lodash/fp/find'

import Title from '../../common/components/Title'
import FormCard, {FormCardTitle, validateFields} from '../../common/components/FormCard'
import Container from '../../common/components/Container'
import {useNotification} from '../../utils/notification'
import {useClients} from '../hooks'
import $client from '../service'

function EditClient(props) {
  const {match} = props
  const {getFieldDecorator} = props.form
  const clients = useClients()
  const [loading, setLoading] = useState(false)
  const [client, setClient] = useState(props.location.state)
  const tryAndNotify = useNotification()
  const {t} = useTranslation()
  const requiredRules = {rules: [{required: true, message: t('field-required')}]}
  const emailRules = {rules: [{type: 'email', message: t('email-invalid')}]}

  useEffect(() => {
    if (clients && !client) {
      setClient(find({id: match.params.id}, clients))
    }
  }, [client, clients, match.params.id])

  async function deleteClient() {
    await tryAndNotify(
      async () => {
        setLoading(true)
        await $client.delete(client)
        props.history.push('/clients')
        return t('/clients.deleted-successfully')
      },
      () => setLoading(false),
    )
  }

  async function saveClient(event) {
    event.preventDefault()
    if (loading) return
    setLoading(true)

    await tryAndNotify(async () => {
      let nextClient = await validateFields(props.form)
      nextClient.id = client.id
      setClient(nextClient)
      await $client.set(nextClient)
      return t('/clients.updated-successfully')
    })

    setLoading(false)
  }

  if (!clients || !client) {
    return null
  }

  const companyFields = {
    title: <FormCardTitle title="company" />,
    fields: [
      {name: 'name', Component: <Input size="large" autoFocus />, ...requiredRules},
      {name: 'siret'},
      {name: 'email', ...emailRules},
      {name: 'phone'},
    ],
  }

  const addressFields = {
    title: <FormCardTitle title="address" />,
    fields: [
      {name: 'address', ...requiredRules},
      {name: 'zip', ...requiredRules},
      {name: 'city', ...requiredRules},
      {name: 'country', ...requiredRules},
    ],
  }

  const fields = [companyFields, addressFields]

  return (
    <Container>
      <Form noValidate layout="vertical" onSubmit={saveClient}>
        <Title label="client">
          <Button.Group>
            <Popconfirm
              title={t('/clients.confirm-deletion')}
              onConfirm={deleteClient}
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
          <FormCard key={key} getFieldDecorator={getFieldDecorator} model={client} {...props} />
        ))}
      </Form>
    </Container>
  )
}

export default Form.create()(EditClient)
