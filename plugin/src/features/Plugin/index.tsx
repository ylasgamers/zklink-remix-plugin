import React, { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { ethers } from 'ethers'
import {
  Environment,
  Compilation,
  Deployment,
  Interaction,
  TransactionHistory,
  SolidityVersion as CompilerVersion
} from '@/features'
import Accordian, { AccordianItem, AccordionContent, AccordionTrigger } from '@/ui_components/Accordian'
import StateAction from '@/components/StateAction'
import BackgroundNotices from '@/components/BackgroundNotices'

import { isCompilingAtom, statusAtom as compilationStatusAtom, hashDirAtom } from '@/atoms/compilation'
import { deploymentAtom } from '@/atoms/deployment'
import { initializeRemixClient, isLoadedAtom, remixClientAtom } from '@/stores/remixClient'
import storage from '@/utils/storage'
import './styles.css'
import useAsync from '@/hooks/useAsync'

export type AccordianTabs = 'compile' | 'deploy' | 'interaction' | 'transactions' | ''

export const Plugin = () => {
  const compilationStatus = useAtomValue(compilationStatusAtom)
  const isCompiling = useAtomValue(isCompilingAtom)

  const [isLoaded, setIsLoaded] = useAtom(isLoadedAtom)
  const setRemixClient = useSetAtom(remixClientAtom)

  const setHashDir = useSetAtom(hashDirAtom)

  useAsync(async () => {
    const client = await initializeRemixClient()
    setRemixClient(client)
    setIsLoaded(true)
  }, [setIsLoaded, setRemixClient])

  useEffect(() => {
    // read hashDir from localStorage
    const hashDir = storage.get('hashDir')
    if (hashDir != null) {
      setHashDir(hashDir)
    } else {
      // create a random hash of length 32
      const hashDir = ethers.utils.hashMessage(ethers.utils.randomBytes(32)).replace('0x', '')
      setHashDir(hashDir)
      storage.set('hashDir', hashDir)
    }
  }, [setHashDir])

  // Deployment Context state variables
  const { isDeploying, deployStatus } = useAtomValue(deploymentAtom)

  // Interaction state variables
  const [interactionStatus] = useState<'loading' | 'success' | 'error' | ''>('')

  const [currentAccordian, setCurrentAccordian] = useState<AccordianTabs>('compile')

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleTabView = (clicked: AccordianTabs) => {
    if (currentAccordian === clicked) {
      setCurrentAccordian('')
    } else {
      setCurrentAccordian(clicked)
    }
  }

  return (
    // add a button for selecting the solidity version
    isLoaded ? (
      <>
        <div className="plugin-wrapper">
          <div className="plugin-main-wrapper">
            <CompilerVersion />
            <Accordian type="single" value={currentAccordian} defaultValue={'compile'}>
              <AccordianItem value="compile">
                <AccordionTrigger
                  onClick={() => {
                    handleTabView('compile')
                  }}
                >
                  <span className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <p style={{ all: 'unset' }}>Compile</p>
                    <StateAction
                      value={
                        isCompiling
                          ? 'loading'
                          : compilationStatus === 'done'
                            ? 'success'
                            : compilationStatus === 'failed'
                              ? 'error'
                              : ''
                      }
                    />
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Compilation setAccordian={setCurrentAccordian} />
                </AccordionContent>
              </AccordianItem>
              <AccordianItem value="deploy">
                <AccordionTrigger
                  onClick={() => {
                    handleTabView('deploy')
                  }}
                >
                  <span className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <p style={{ all: 'unset' }}>Deploy</p>
                    <StateAction
                      value={
                        isDeploying
                          ? 'loading'
                          : deployStatus === 'error'
                            ? 'error'
                            : deployStatus === 'done'
                              ? 'success'
                              : ''
                      }
                    />
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Deployment setActiveTab={setCurrentAccordian} />
                </AccordionContent>
              </AccordianItem>
              <AccordianItem value="interaction">
                <AccordionTrigger
                  onClick={() => {
                    handleTabView('interaction')
                  }}
                >
                  <span className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <p style={{ all: 'unset' }}>Interact</p>
                    <StateAction value={interactionStatus} />
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Interaction />
                </AccordionContent>
              </AccordianItem>

              {/*  Transactions start */}
              <AccordianItem value="transactions">
                <AccordionTrigger
                  onClick={() => {
                    handleTabView('transactions')
                  }}
                >
                  <span className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                    <p style={{ all: 'unset' }}> Transactions</p>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <TransactionHistory />
                </AccordionContent>
              </AccordianItem>
            </Accordian>
            <div className="mt-5">
              <BackgroundNotices />
            </div>
          </div>
          <div>
            <Environment />
          </div>
        </div>
      </>
    ) : (
      <h1>Loading...</h1>
    )
  )
}
