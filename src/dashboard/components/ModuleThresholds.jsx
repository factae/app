import React from 'react'
import {useTranslation} from 'react-i18next'
import Col from 'antd/es/col'
import Card from 'antd/es/card'

import {FormCardTitle} from '../../common/components/FormCard'
import Link from '../../common/components/Link'
import {toEuro} from '../../common/currency'
import {useProfile} from '../../profile/hooks'

const links = [
  'https://www.service-public.fr/professionnels-entreprises/vosdroits/F32353',
  'https://www.shine.fr/blog/assujetti-tva-auto-entrepreneur',
  'https://www.portail-autoentrepreneur.fr/actualites/comment-faire-declaration-tva',
  'https://www.auto-entrepreneur.fr/statut-auto-entrepreneur/limites/plafonds.html',
]

function useThresholds() {
  const profile = useProfile()

  if (!profile) {
    return [0, 0, 0]
  }

  switch (profile.activity) {
    case 'trade':
      return [82800, 91000, 170000]

    case 'service':
      return [33200, 35200, 70000]

    default:
      return [0, 0, 0]
  }
}

function ModuleThresholds() {
  const [lowTVA, highTVA, AE] = useThresholds()
  const {t} = useTranslation()

  return (
    <Col xs={24}>
      <Card title={<FormCardTitle title={'thresholds'} />}>
        <div dangerouslySetInnerHTML={{__html: t('/dashboard.part-a', {value: toEuro(lowTVA)})}} />
        <ul>
          <li>
            {t('/dashboard.part-a-1')}
            <ul>
              <li>{t('/dashboard.part-a-2')}</li>
              <li>{t('/dashboard.part-a-3')}</li>
              <li>{t('/dashboard.part-a-4')}</li>
            </ul>
          </li>
        </ul>
        <div dangerouslySetInnerHTML={{__html: t('/dashboard.part-b', {value: toEuro(highTVA)})}} />
        <ul>
          <li>{t('/dashboard.part-b-1')}</li>
          <li>{t('/dashboard.part-b-2')}</li>
          <li>{t('/dashboard.part-b-3')}</li>
        </ul>
        <div dangerouslySetInnerHTML={{__html: t('/dashboard.part-c', {value: toEuro(AE)})}} />
        <ul>
          <li>{t('/dashboard.part-c-1')}</li>
        </ul>
        <div style={{marginTop: 30}}>
          {links.map((link, key) => (
            <div key={key}>
              <Link to={link} />
            </div>
          ))}
        </div>
      </Card>
    </Col>
  )
}

export default ModuleThresholds
