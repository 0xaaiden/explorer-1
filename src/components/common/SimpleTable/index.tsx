import React from 'react'
import styled from 'styled-components'
import { MEDIA } from 'const'

// TODO: move to theme AAAAND pick color for white variant
const FONT_COLOR = '#FFFFFF';
const TR_BORDER_COLOR = 'rgba(151, 151, 184, 0.1)';
const TABLE_BORDER_COLOR = 'rgba(151, 151, 184, 0.3)';
const CELL_HEIGHT = '4.8rem';

const Wrapper = styled.table<{ $numColumns?: number }>`
  font-size: var(--font-size-default);
  background-color: transparent;
  color: ${FONT_COLOR};
  height: 100%;
  width: 100%;
  margin: 1.6rem auto 2.4rem;
  padding: 0;
  box-sizing: border-box;
  border-spacing: 0;
  display: inline-grid;
  grid-template-areas:
    'head-fixed'
    'body-scrollable';
  border: 0.1rem solid ${TABLE_BORDER_COLOR};
  border-radius: 0.4rem;

  > thead {
    grid-area: head-fixed;
    position: sticky;
    top: 0;
    height: auto;
    display: flex;
    align-items: center;

    > tr {
      color: var(--color-text-secondary2);
      display: grid;
      width: calc(100% - 0.6rem);
      background: transparent;

      > th {
        font-weight: var(--font-weight-normal);
        &:not(:first-of-type) {
          text-align: right;
        }
      }
    }
  }

  > tbody {
    grid-area: body-scrollable;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    box-sizing: border-box;
    padding: 0;

    > tr {
      display: grid;
      width: 100%;
      transition: background-color 0.1s ease-in-out;
      border-bottom: 0.1rem solid ${TR_BORDER_COLOR};
      height: ${CELL_HEIGHT};
      padding: 1rem;
      box-sizing: border-box;

      @media ${MEDIA.mobile} {
        display: flex;
        flex-flow: column wrap;
        height: auto;
        align-items: flex-start;
      }

      &:hover {
        background: var(--color-text-hover);
        > td {
          color: var(--color-text-primary);
        }
      }
    }

  }

  tr {
    text-align: left;
    padding: 0;

    > td {
      padding: 0;
      transition: color 0.1s ease-in-out;
      box-sizing: border-box;
    }

    align-items: center;
    ${({ $numColumns }): string => ($numColumns ? `grid-template-columns: repeat(${$numColumns}, 1fr);` : '')}

    > th, 
    > td {
      height: 3rem;
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }
`

export type Props = {
  header?: JSX.Element
  body: JSX.Element
  className?: string
  numColumns?: number
}

export const SimpleTable = ({ header, body, className, numColumns }: Props): JSX.Element => (
  <Wrapper $numColumns={numColumns} className={className}>
    {header && <thead>{header}</thead>}
    <tbody>{body}</tbody>
  </Wrapper>
)
