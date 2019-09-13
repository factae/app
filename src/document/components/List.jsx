import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {DateTime} from 'luxon'
import Button from 'antd/es/button'
import Form from 'antd/es/form'
import Icon from 'antd/es/icon'
import Table from 'antd/es/table'
import Tag from 'antd/es/tag'
import Tooltip from 'antd/es/tooltip'
import find from 'lodash/fp/find'
import getOr from 'lodash/fp/getOr'
import isEmpty from 'lodash/fp/isEmpty'
import map from 'lodash/fp/map'
import omit from 'lodash/fp/omit'
import orderBy from 'lodash/fp/orderBy'
import pipe from 'lodash/fp/pipe'

import Container from '../../common/components/Container'
import Title from '../../common/components/Title'
import {toEuro} from '../../utils/currency'
import {useNotification} from '../../utils/notification'
import {useProfile} from '../../profile/hooks'
import {isProfileValid} from '../../profile/utils'
import {useClients} from '../../client/hooks'
import {useDocuments} from '../hooks'
import $document from '../service'

const alphabeticSort = key => (a, b) => a[key].localeCompare(b[key])
const dateSort = key => (a, b) => DateTime.fromISO(a[key]) - DateTime.fromISO(b[key])

const CustomTag = ({children, ...props}) => (
  <Tag {...props} style={{float: 'right', cursor: 'inherit', textTransform: 'lowercase'}}>
    {children}
  </Tag>
)

function DocumentList(props) {
  const profile = useProfile()
  const clients = useClients()
  const documents = useDocuments()
  const [pagination, setPagination] = useState({})
  const tryAndNotify = useNotification()
  const {t, i18n} = useTranslation()

  async function importDocument() {
    await tryAndNotify(() => {
      if (!isProfileValid(profile)) throw new Error('/profile.error-invalid')
      if (isEmpty(clients)) throw new Error('/clients.error-empty')

      const now = DateTime.local()
      const document = {
        id: $document.generateId(),
        type: 'invoice',
        createdAt: now.toISO(),
        imported: true,
      }

      props.history.push(`/documents/${document.id}`, document)
    })
  }

  async function createDocument() {
    await tryAndNotify(() => {
      if (!isProfileValid(profile)) throw new Error('/profile.error-invalid')
      if (isEmpty(clients)) throw new Error('/clients.error-empty')

      const now = DateTime.local()
      const document = {
        id: $document.generateId(),
        type: 'quotation',
        createdAt: now.toISO(),
        taxRate: profile.taxRate,
        conditions: profile.quotationConditions,
        expiresIn: 60,
        paymentDeadlineAt: now.plus({days: 30}).toISO(),
      }

      props.history.push(`/documents/${document.id}`, document)
    })
  }

  useEffect(() => {
    if (documents) {
      setPagination({...pagination, total: documents.length})
    }
  }, [documents])

  if (!profile || !clients || !documents) {
    return null
  }

  function getCustomTag(document) {
    if (document.declaredUrssafAt || document.declaredVatAt) {
      return <CustomTag color="red">{t('declared')}</CustomTag>
    }

    if (document.signedAt) {
      return <CustomTag color="green">{t('signed')}</CustomTag>
    }

    if (document.paidAt) {
      return <CustomTag color="green">{t('paid')}</CustomTag>
    }

    if (document.refundedAt) {
      return <CustomTag color="green">{t('refunded')}</CustomTag>
    }

    if (document.sentAt) {
      return <CustomTag color="blue">{t('sent')}</CustomTag>
    }
  }

  const columns = [
    {
      title: <strong>{t('number')}</strong>,
      dataIndex: 'number',
      width: '30%',
      sorter: alphabeticSort('number'),
      render: (_, d) => (
        <>
          {d.number || <em className="ant-form-explain">{t(d.type)}</em>}
          {getCustomTag(d)}
        </>
      ),
    },
    {
      title: <strong>{t('client')}</strong>,
      dataIndex: 'client',
      sorter: alphabeticSort('client'),
      width: '30%',
      render: (client, document) => {
        if (document.imported) return client
        return pipe([find({id: client}), getOr('', 'name')])(clients)
      },
    },
    {
      title: <strong>{t('date')}</strong>,
      dataIndex: 'updatedAt',
      sorter: dateSort('updatedAt'),
      width: '20%',
      render: dateISO => {
        const date = DateTime.fromISO(dateISO, {locale: i18n.language})

        return (
          <Tooltip title={date.toFormat(t('date-format'))}>
            {date.toRelative({locale: i18n.language})}
          </Tooltip>
        )
      },
    },
    {
      title: <strong>{t('total-without-taxes')}</strong>,
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.totalHT - b.totalHT,
      width: '20%',
      align: 'right',
      render: (_, {totalHT}) => toEuro(totalHT),
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      fixed: 'right',
      render: () => (
        <Button type="link" size="small" shape="circle">
          <Icon type="edit" />
        </Button>
      ),
    },
  ]

  const dataSource = pipe([
    orderBy('updatedAt', 'desc'),
    map(document => ({...document, key: document.id})),
  ])

  return (
    <Container>
      <Title label={t('quotations-and-invoices')}>
        <Button.Group>
          <Button onClick={importDocument}>
            <Icon type="import" />
            {t('import')}
          </Button>
          <Button type="primary" onClick={createDocument}>
            <Icon type="plus" />
            {t('new')}
          </Button>
        </Button.Group>
      </Title>

      <Table
        pagination={pagination}
        dataSource={dataSource(documents)}
        columns={columns}
        rowKey={record => record.id}
        onRow={record => ({
          onClick: () => props.history.push(`/documents/${record.id}`, {...omit('key', record)}),
        })}
        bodyStyle={{background: '#ffffff', cursor: 'pointer'}}
      />
    </Container>
  )
}

export default Form.create()(DocumentList)
