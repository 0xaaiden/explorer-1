import React from 'react'
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0'
import { TokenImg, Props } from './TokenImg'
import { WETH_ADDRESS_MAINNET, WETH_ADDRESS_RINKEBY } from 'const'
import { Frame } from './Frame'
import styled from 'styled-components'

const ADDRESS_GNO = '0x6810e776880C02933D47DB1b9fc05908e5386b96'
const ADDRESS_WXDAI = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'

export default {
  title: 'Common/TokenImg',
  decorators: [
    (DecoratedStory): JSX.Element => (
      <div style={{ textAlign: 'center' }}>
        <Frame style={{ display: 'inline-block', padding: 0 }}>{DecoratedStory()}</Frame>
      </div>
    ),
  ],
  component: TokenImg,
  excludeStories: ['TokenImgRestyled'],
} as Meta

const Template: Story<Props> = (args) => <TokenImg {...args} />

export const WethMainnet = Template.bind({})
WethMainnet.args = {
  address: WETH_ADDRESS_MAINNET,
}

export const WethRinkeby = Template.bind({})
WethRinkeby.args = {
  address: WETH_ADDRESS_RINKEBY,
  addressMainnet: WETH_ADDRESS_MAINNET,
}

export const WrappedXdai = Template.bind({})
WrappedXdai.args = {
  address: ADDRESS_WXDAI,
  faded: true,
}

export const Unknown = Template.bind({})
Unknown.args = {
  address: '0x1',
}

export const Gno = Template.bind({})
Gno.args = {
  address: ADDRESS_GNO,
}

export const Faded = Template.bind({})
Faded.args = {
  address: ADDRESS_GNO,
  faded: true,
}

export const TokenImgRestyled = styled(TokenImg)`
  width: 4rem;
  height: 4rem;
  margin: 0.5rem 3rem 0.5rem 0.5rem;
  background-color: yellow;
`
export const Restyle: Story = () => (
  <>
    <TokenImgRestyled address={ADDRESS_GNO} /> Reestyled GNO logo
  </>
)
