import { App, Button, Card, Flex, InputNumber, Layout, List, Space, Switch, Typography } from 'antd'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

type ItemStats = {
  heal?: number
  attack?: number
  targetCount?: number
  power?: number
  repeatChance?: number
}

type Item = {
  type: 'skill' | 'weapon' | 'modifier'
  name: string
  description: () =>  string,
  score: () => number
  stats: ItemStats
  level: number
  lastChance: number
  strategy: 'use' | 'win' | 'useAny'
  uses: number,
}

const itemsDefault: GameState['items'] = [
  {
    type: 'skill',
    name: 'Исцеление',
    description: function (){return `Исцеляет на ${this.stats.heal} (${this.stats.heal} + 1% за ур.) + Исцеление здоровья`},
    stats: {
      heal: 5,
    },
    lastChance: 0,
    level: 0,
    score: function () { return (this.stats.heal || 0) + Math.floor((this.stats.heal || 0) * this.level / 100) || 0 },
    strategy: 'use',
    uses: 0,
  },
  {
    type: 'skill',
    name: 'Сильный удар',
    description: function () {return `Бьёт на 10 (10 + 1% за ур.) + Атака здоровья`},
    stats: {
      attack: 10
    },
    lastChance: 0,
    level: 0,
    score: function () { return this.stats.attack ? (this.stats.attack + Math.floor(this.stats.attack * this.level / 100)) : 0},
    strategy: 'use',
    uses: 0,
  },
  {
    type: 'weapon',
    name: 'Посох',
    description: function () {return `Атака + 20 (+1% за 100 ур), Исцеление +10 (+1% за 100 ур)`},
    stats: {
      attack: 20,
      heal: 10,
    },
    lastChance: 0,
    level: 0,
    score: function () { return ((this.stats.attack || 0) + Math.floor((this.stats.attack || 0) * this.level / 100) + ((this.stats.attack || 0) + Math.floor((this.stats.attack || 0) * this.level / 100)))},
    strategy: 'useAny',
    uses: 0,
  },
]

const modifiersDefaults: GameState['items'] = [
  {
    type: 'modifier',
    name: 'Цели',
    description:  function () {return `Дополнительная Цель + 1 ( +1 за 100 ур)`},
    stats: {
      targetCount: 1,
    },
    lastChance: 0,
    level: 0,
    score: () => 100,
    strategy: 'win',
    uses: 0,
  },
  {
    type: 'modifier',
    name: 'Мощность',
    description:  function () {return `Увеличивает мощность умения на 10 (10 + 1 за ур.)%`},
    stats: {
      power: 10,
    },
    score: () => 10,
    lastChance: 0,
    level: 0,
    strategy: 'win',
    uses: 0,
  },
  {
    type: 'weapon',
    name: 'Повтор',
    description:  function () {return `С шансом 10 (10 + 1 за ур)% повторно используется`},
    stats: {
      repeatChance: 10,
    },
    score: () => 10,
    lastChance: 0,
    level: 0,
    strategy: 'win',
    uses: 0,
  },
]

interface GameState {
  battlesCount: number,
  spendTime: number,
  increaseBattlesCount: (by: number) => void,
  reset: () => void,
  items: Item[],
  updateItems: (newItems: GameState['items']) => void
  updateItemLevel: (indexItem: number, levels: number, lastChance: number) => void
  settings: {
    effectiveMaxLevel: number
    minChance: number
    modifierStepLevel: number
    time: number
  },
  updateSettings: (newSettings: GameState['settings']) => void
  history: string[],
  addHistory: (text: string) => void
}

const useGameStore = create<GameState>()((set) => ({
  battlesCount: 0,
  spendTime: 0,
  increaseBattlesCount: (by = 1) => set((state) => ({ battlesCount: state.battlesCount + by })),
  reset: () => set(() => ({ battlesCount: 0 })),
  items: itemsDefault,
  updateItems: (newItems) => set(() => ({ items: newItems })),
  updateItemLevel: (indexItem, levels, lastChance) => set((state) => ({ items: state.items.map((item, index) => index === indexItem ? { ...item, level: item.level + levels, lastChance } : item) })),
  settings: {
    effectiveMaxLevel: 100,
    minChance: 1,
    modifierStepLevel: 100,
    time: 60,
  },
  updateSettings: (newSettings) => set(() => ({ settings: newSettings })),
  history: [],
  addHistory: (text) => set((state) => ({ history: [text, ...state.history] })),
}))

let intervalBattle = 0

function Application() {

  const store = useGameStore(useShallow(state => state));

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
    store.addHistory(`Уровень ${store.items[indexItem].name} ${store.items[indexItem].level}  повышен на ${levels} с шансом (${lastChance}) в битве ${store.battlesCount}`)
    store.updateItemLevel(indexItem, levels, lastChance)
  }

  const chanceLevelUp = (indexItem: number, levels: number = 1) => {
    const random = Math.floor(Math.random() * 101)
    const currentLevel = store.items[indexItem].level
    console.log('chance level up a > b', indexItem, random, currentLevel)
    if (random >= 99 || random >= currentLevel) { handleLevelUp(indexItem, levels, random) }
  }

  const handleUpdateModifiers = () => {
    
  }

  const makeWin = (count = 1) => {
    for (let i = 0; i < count; i++) {
      store.increaseBattlesCount(1)
      // handleLevelUp(1, 1, -1)
      chanceLevelUp(0, 1)
      chanceLevelUp(1, 1)
      chanceLevelUp(2, 1)
      handleUpdateModifiers()
      // chanceLevelUp(1, 1)
      // chanceLevelUp(0, 1)
    }
  }

  const handleStart = (value: boolean) => {
    if (value) {
      intervalBattle = setInterval(() => {
        makeWin(1)
      }, 50)
    } else {
      clearInterval(intervalBattle)
    }
  }

  return (
    <App>
      <Layout>
        <Layout.Header style={{ background: 'transparent' }}>Калькулятор игровой системы</Layout.Header>
        <Layout>
          <Layout.Sider width='25%'>
            {/* ИСТОРИЯ */}
            <Card style={{ height: '100%' }} title="История">
              <List
                style={{ maxHeight: '800px', overflow: 'auto' }}
                bordered
                dataSource={store.history}
                renderItem={(item) => <List.Item>{item}</List.Item>} />
            </Card>
          </Layout.Sider>
          <Layout.Content>
            <Flex gap='large' vertical>

              {/* Панели */}
              <Flex gap='small' align='space-between'>
                <Card title="Панель">
                  <Flex vertical gap='small'>
                    <Space>
                      <Button onClick={() => makeWin(1)}>Победа</Button>
                      <Button onClick={() => makeWin(10)}>+10 побед</Button>
                      <Button onClick={() => makeWin(100)}>+100 побед</Button>
                      <Button onClick={() => makeWin(1000)}>+1000 побед</Button>
                      <Button onClick={() => makeWin(5000)}>+5000 побед</Button>
                    </Space>
                    <Space>
                      <Switch checkedChildren="Старт" unCheckedChildren="Стоп" onChange={handleStart} />
                      <Button onClick={store.reset}>Сбросить</Button>
                    </Space>

                    <Flex gap='small' vertical>
                      <Typography.Text>Боёв: {store.battlesCount}</Typography.Text>
                      <Typography.Text>Время: {getTimeFormat()}</Typography.Text>
                    </Flex>
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
                      <Typography.Text>Модификатор</Typography.Text> <InputNumber value={store.settings.modifierStepLevel} onChange={handleChangeSettings('modifierStepLevel')} addonAfter='ур.' />
                    </Space>
                    <Space>
                      <Typography.Text>Время</Typography.Text> <InputNumber value={store.settings.time} onChange={handleChangeSettings('time')} addonAfter='сек.' />
                    </Space>
                  </Flex>
                </Card>
              </Flex>

              {/* УМЕНИЯ */}
              <Flex gap='small'>
                {store.items.map((item, index) =>
                  <Card key={item.name} title={item.type === 'skill' ? 'Умение' : 'Оружие'} extra={<Button onClick={() => handleLevelUp(index, 25, -1)}>+ 25 уровней</Button>}>
                    <Flex vertical>
                      <Typography.Text>Ур. {item.level}. Шанс {100 - (item.level < 100 ? item.level : 99)}%. Предыдущий шанс: {item.lastChance}%</Typography.Text>
                      <Typography.Text>Описание: {item.description()}</Typography.Text>
                      <Typography.Text>БМ: {item.score()}</Typography.Text>
                      <Typography.Text>Использований: {item.uses} </Typography.Text>
                      <Typography.Text>Улучшение: при использовании {item.strategy === 'useAny' && 'и атаке'} </Typography.Text>
                      {modifiersDefaults.map((modifier, modifierIndex) =>
                        <Card key={index + modifier.name} extra={item.level + 1 <= (modifierIndex + 1) * 100 ? 'Нужен уровень ' + ((modifierIndex + 1) * 100) : 'Работает'}>
                          <Flex vertical>
                            <Typography.Text>Ур. {modifier.level}. Шанс {modifier.level}%</Typography.Text>
                            <Typography.Text>Описание: {modifier.description()}</Typography.Text>
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
        </Layout>
        <Layout.Footer>
          <Typography.Link href='https://t.me/mikhail_eco_coach' target='_blank'>Телеграмм</Typography.Link>
        </Layout.Footer>
      </Layout>
    </ App>
  )
}

export default Application
