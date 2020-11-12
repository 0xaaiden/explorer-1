import React from 'react'

// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Meta } from '@storybook/react/types-6-0'

import GlobalStyles from 'components/layout/GenericLayout/GlobalStyles'
import { Router } from 'storybook/decorators'
import { TokenPairSelector } from 'components/TokenPairSelector'

export default {
  title: 'component/TokenPairSelector',
  component: TokenPairSelector,
  decorators: [Router],
} as Meta

export const Normal: React.FC = () => (
  <div>
    <GlobalStyles />
    <TokenPairSelector selectedPair="ETH/USDC" selectLabel="Select Pair" />
  </div>
)
