import { App, Button, Card, Flex, InputNumber, Layout, Space, Switch, Typography } from 'antd'
import { create } from 'zustand'

interface GameState {
  battlesCount: number,
  spendTime: number,
  increaseBattlesCount: (by: number) => void,
  reset: () => void,
  items: {
    type: 'skill' | 'weapon' | 'modifier'
    name: string
    description: string,
    level: number
    lastChance: number
    strategy: 'use' | 'win' | 'useAny'
    uses: number
  }[],
  updateItems: (newItems: GameState['items']) => void
  settings: {
    effectiveMaxLevel: number
    minChance: number
    modifierStepLevel: number
    time: number
  },
  updateSettings: (newSettings: GameState['settings']) => void
}

const itemsDefault: GameState['items'] = [
  {
    type: 'skill',
    name: 'Исцеление',
    description: 'Исцеляет на 10 (10 + 1% за ур.) + Исцеление здоровья',
    lastChance: 0,
    level: 0,
    strategy: 'use',
    uses: 0,
  },
  {
    type: 'skill',
    name: 'Сильный удар',
    description: 'Бьёт на 10 (10 + 1% за ур.) + Атака здоровья',
    lastChance: 0,
    level: 0,
    strategy: 'use',
    uses: 0,
  },
  {
    type: 'weapon',
    name: 'Посох',
    description: 'Атака + 10 (+1% за 100 ур), Исцеление +5 (+1% за 100 ур)',
    lastChance: 0,
    level: 0,
    strategy: 'useAny',
    uses: 0,
  },
]

const modifiersDefaults: GameState['items'] = [
  {
    type: 'modifier',
    name: 'Цели',
    description: 'Дополнительная Цель + 1 ( +1 за 100 ур)',
    lastChance: 0,
    level: 0,
    strategy: 'win',
    uses: 0,
  },
  {
    type: 'modifier',
    name: 'Мощность',
    description: 'Увеличивает мощность умения на 10 (10 + 1 за ур.)%',
    lastChance: 0,
    level: 0,
    strategy: 'win',
    uses: 0,
  },
  {
    type: 'weapon',
    name: 'Повтор',
    description: 'С шансом 10 (10 + 1 за ур)% повторно используется',
    lastChance: 0,
    level: 0,
    strategy: 'win',
    uses: 0,
  },
]

const useGameStore = create<GameState>()((set) => ({
  battlesCount: 0,
  spendTime: 0,
  increaseBattlesCount: (by = 1) => set((state) => ({ battlesCount: state.battlesCount + by })),
  reset: () => set(() => ({ battlesCount: 0 })),
  items: itemsDefault,
  updateItems: (newItems) => set(() => ({ items: newItems })),
  settings: {
    effectiveMaxLevel: 100,
    minChance: 1,
    modifierStepLevel: 100,
    time: 60,
  },
  updateSettings: (newSettings) => set(() => ({ settings: newSettings }))
}))

let intervalBattle = 0

function Application() {

  const store = useGameStore();

  const handleChangeSettings = (prop: string) => (value: number | null) => {
    store.updateSettings({ ...store.settings, [prop]: value || 0 })
  }

  const getTimeFormat = () => {
    const timeSec = store.battlesCount * store.settings.time
    const hours = (timeSec / 60 / 60)
    if (hours > 24) {
      return (hours / 24).toFixed(1) + ' дней'
    }
    return hours.toFixed(1) + ' ч.'
  }

  const handleLevelUp = (indexItem: number, levels: number, lastChance: number,) => {
    console.log('level up', indexItem, levels, store.items)
    store.updateItems(store.items.map((item, index) => index === indexItem ? { ...item, level: item.level + levels, lastChance: lastChance } : item))
  }

  const chanceLevelUp = (indexItem: number, levels: number = 1) => {
    console.log('chance level up', indexItem)
    const random = Math.floor(Math.random() * 101)
    if (store.items[indexItem].level > 99) {
      if (random >= 99) { handleLevelUp(indexItem, levels, random) }
    } else {
      if (random >= store.items[indexItem].level) { handleLevelUp(indexItem, levels, random) }
    }
  }

  const makeWin = (count = 1) => {
    for (let i = 0; i < count; i++) {
      chanceLevelUp(0, 1)
      // handleLevelUp(1, 1, -1)
      // chanceLevelUp(1, 1)
      // chanceLevelUp(2, 1)
      // chanceLevelUp(1, 1)
      // chanceLevelUp(0, 1)
      store.increaseBattlesCount(1)
    }
  }

  const handleStart = (value: boolean) => {
    if (value) {
      intervalBattle = setInterval(() => {
        makeWin(1)
      }, 100)
    } else {
      clearInterval(intervalBattle)
    }
  }

  return (
    <App>
      <Layout>
        <Layout.Header style={{ background: 'transparent' }}>
          <Typography.Title level={2}>Калькулятор игровой системы</Typography.Title>
        </Layout.Header>
        <Layout.Content>
          <Flex gap='large' vertical>


            <Flex gap='small' align='space-between'>
              <Card title="Панель">
                <Flex vertical gap='small'>
                  <Space>
                    <Button onClick={() => makeWin(1)}>Победа</Button>
                    <Button onClick={() => makeWin(10)}>+10 побед</Button>
                    <Button onClick={() => makeWin(100)}>+100 побед</Button>
                    <Button onClick={() => makeWin(1000)}>+1000 побед</Button>
                  </Space>
                  <Space>
                    <Switch checkedChildren="Старт" unCheckedChildren="Стоп" onChange={handleStart} />
                    <Button onClick={store.reset}>Сбросить</Button>
                  </Space>
                </Flex>
              </Card>
              <Card title="Информация">
                <Flex gap='small' vertical>
                  <Typography.Text>Боёв: {store.battlesCount}</Typography.Text>
                  <Typography.Text>Время: {getTimeFormat()}</Typography.Text>
                </Flex>
              </Card>
              <Card title="Настройки">
                <Flex gap='small' vertical>
                  <Space>
                    <Typography.Text>Предел</Typography.Text> <InputNumber value={store.settings.effectiveMaxLevel} onChange={handleChangeSettings('effectiveMaxLevel')} addonAfter='ур.' />
                  </Space>
                  <Space>
                    <Typography.Text>Мин. шанс</Typography.Text> <InputNumber value={store.settings.minChance} onChange={handleChangeSettings('minChance')} addonAfter='%' />
                  </Space>
                  <Space>
                    <Typography.Text>Шаг модификаторов</Typography.Text> <InputNumber value={store.settings.modifierStepLevel} onChange={handleChangeSettings('modifierStepLevel')} addonAfter='ур.' />
                  </Space>
                  <Space>
                    <Typography.Text>Время</Typography.Text> <InputNumber value={store.settings.time} onChange={handleChangeSettings('time')} addonAfter='сек.' />
                  </Space>
                </Flex>
              </Card>
            </Flex>
            <Flex gap='small'>
              {store.items.map((item, index) =>
                <Card key={item.name} title={item.type === 'skill' ? 'Умение' : 'Оружие'} extra={<Button onClick={() => handleLevelUp(index, 25, -1)}>+ 25 уровней</Button>}>
                  <Flex vertical>
                    <Typography.Text>Ур. {item.level}. Шанс {100 - item.level}%. Предыдущий шанс: {item.lastChance}%</Typography.Text>
                    <Typography.Text>Описание: {item.description}</Typography.Text>
                    <Typography.Text>Использований: {item.uses} </Typography.Text>
                    <Typography.Text>Улучшение: при использовании {item.strategy === 'useAny' && 'и атаке'} </Typography.Text>
                    {modifiersDefaults.map(modifier =>
                      <Card key={index + modifier.name} title={'Модификатор: ' + modifier.name}>
                        <Flex vertical>
                          <Typography.Text>Ур. {modifier.level}. Шанс {modifier.level}%</Typography.Text>
                          <Typography.Text>Описание: {modifier.description}</Typography.Text>
                          <Typography.Text>Использований: {modifier.uses} </Typography.Text>
                          <Typography.Text>Улучшение: при победе</Typography.Text>
                        </Flex>
                      </Card>
                    )}
                  </Flex>
                </Card>
              )}
            </Flex>
          </Flex>
        </Layout.Content>
        <Layout.Footer>
          <Typography.Link href='https://t.me/mikhail_eco_coach' target='_blank'>Телеграмм</Typography.Link>
        </Layout.Footer>
      </Layout>
    </ App>
  )
}

export default Application
