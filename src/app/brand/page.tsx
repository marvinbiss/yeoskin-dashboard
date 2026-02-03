/**
 * Yeoskin Brand Component Preview
 * Premium UI components showcase
 */

'use client'

import React, { useState } from 'react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Dropdown,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Avatar,
  AvatarGroup,
  StatCard,
  StatsGrid,
  Skeleton,
  SkeletonCard,
  ProgressBar,
  CircularProgress,
  StepsProgress,
  Modal,
  ConfirmModal,
  Switch,
  Tooltip,
  EmptyState,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  ToastContainer,
  useToast,
} from '@/components/Brand'
import {
  Search,
  Plus,
  Download,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Mail,
  Settings,
  Home,
} from 'lucide-react'

export default function BrandPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [switchValue, setSwitchValue] = useState(false)
  const [dropdownValue, setDropdownValue] = useState('')
  const { toasts, toast, removeToast } = useToast()

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Yeoskin Design System
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Premium UI components built with Stripe/Nike level polish. Every
            component follows our brand guidelines for consistency and elegance.
          </p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Buttons
          </h2>
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  With Icon
                </Button>
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Inputs
          </h2>
          <Card>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Default Input" placeholder="Enter text..." />
                <Input
                  label="With Icon"
                  placeholder="Search..."
                  leftIcon={<Search className="w-5 h-5" />}
                />
                <Input
                  label="With Error"
                  placeholder="Enter email..."
                  error="Please enter a valid email"
                />
                <Input
                  label="With Hint"
                  placeholder="Enter password..."
                  hint="Must be at least 8 characters"
                  type="password"
                />
                <Dropdown
                  label="Dropdown"
                  placeholder="Select option..."
                  value={dropdownValue}
                  onChange={setDropdownValue}
                  options={[
                    { value: 'opt1', label: 'Option 1' },
                    { value: 'opt2', label: 'Option 2' },
                    { value: 'opt3', label: 'Option 3', description: 'With description' },
                  ]}
                />
                <div className="flex items-end">
                  <Switch
                    checked={switchValue}
                    onChange={setSwitchValue}
                    label="Toggle Switch"
                    description="Enable or disable feature"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Badges
          </h2>
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="brand">Brand</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Badge variant="success" dot>
                  With Dot
                </Badge>
                <Badge size="sm">Small</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Avatars */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Avatars
          </h2>
          <Card>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <Avatar size="xs" name="John Doe" />
                <Avatar size="sm" name="Jane Smith" />
                <Avatar size="md" name="Alice Johnson" />
                <Avatar size="lg" name="Bob Wilson" status="online" />
                <Avatar size="xl" name="Carol Brown" status="away" />
                <Avatar size="2xl" name="Dave Miller" status="busy" />
              </div>
              <div className="flex items-center gap-6">
                <AvatarGroup
                  avatars={[
                    { name: 'John Doe' },
                    { name: 'Jane Smith' },
                    { name: 'Alice Johnson' },
                    { name: 'Bob Wilson' },
                    { name: 'Carol Brown' },
                  ]}
                  max={3}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Stats Cards
          </h2>
          <StatsGrid>
            <StatCard
              label="Total Revenue"
              value="$24,500"
              icon={<DollarSign className="w-6 h-6" />}
              change={{ value: 12.5, type: 'increase', period: 'last month' }}
              variant="brand"
            />
            <StatCard
              label="Active Creators"
              value="1,234"
              icon={<Users className="w-6 h-6" />}
              change={{ value: 8.2, type: 'increase', period: 'last month' }}
              variant="success"
            />
            <StatCard
              label="Conversion Rate"
              value="3.24%"
              icon={<TrendingUp className="w-6 h-6" />}
              change={{ value: 2.1, type: 'decrease', period: 'last month' }}
            />
            <StatCard
              label="Products"
              value="48"
              icon={<Package className="w-6 h-6" />}
            />
          </StatsGrid>
        </section>

        {/* Progress */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Progress
          </h2>
          <Card>
            <CardContent>
              <div className="space-y-6">
                <ProgressBar value={65} showLabel />
                <div className="flex gap-8">
                  <ProgressBar value={25} variant="success" size="sm" className="flex-1" />
                  <ProgressBar value={50} variant="warning" size="md" className="flex-1" />
                  <ProgressBar value={75} variant="error" size="lg" className="flex-1" />
                </div>
                <div className="flex items-center justify-around py-4">
                  <CircularProgress value={25} />
                  <CircularProgress value={50} size={80} />
                  <CircularProgress value={75} size={96} variant="success" />
                </div>
                <StepsProgress
                  currentStep={1}
                  steps={[
                    { title: 'Account', description: 'Create account' },
                    { title: 'Profile', description: 'Add details' },
                    { title: 'Verify', description: 'Confirm email' },
                    { title: 'Complete', description: 'All done!' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tabs */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Tabs</h2>
          <Card>
            <CardContent>
              <Tabs defaultValue="home">
                <TabList>
                  <Tab value="home" icon={<Home className="w-4 h-4" />}>
                    Home
                  </Tab>
                  <Tab value="inbox" icon={<Mail className="w-4 h-4" />} count={5}>
                    Inbox
                  </Tab>
                  <Tab value="settings" icon={<Settings className="w-4 h-4" />}>
                    Settings
                  </Tab>
                </TabList>
                <TabPanel value="home" className="mt-4">
                  <p className="text-neutral-600">Welcome to the home tab content.</p>
                </TabPanel>
                <TabPanel value="inbox" className="mt-4">
                  <p className="text-neutral-600">You have 5 new messages.</p>
                </TabPanel>
                <TabPanel value="settings" className="mt-4">
                  <p className="text-neutral-600">Manage your settings here.</p>
                </TabPanel>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Table */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Table</h2>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell align="right">Revenue</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Sarah Johnson</TableCell>
                <TableCell>
                  <Badge variant="success" dot>Active</Badge>
                </TableCell>
                <TableCell align="right">$12,450</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Michael Chen</TableCell>
                <TableCell>
                  <Badge variant="warning" dot>Pending</Badge>
                </TableCell>
                <TableCell align="right">$8,200</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Emily Davis</TableCell>
                <TableCell>
                  <Badge variant="brand" dot>Premium</Badge>
                </TableCell>
                <TableCell align="right">$24,800</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        {/* Skeleton */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Loading States
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <SkeletonCard />
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton variant="text" height={24} width="60%" />
                  <Skeleton variant="text" height={16} />
                  <Skeleton variant="text" height={16} />
                  <Skeleton variant="text" height={16} width="80%" />
                  <div className="flex gap-2 mt-4">
                    <Skeleton variant="rounded" width={100} height={40} />
                    <Skeleton variant="rounded" width={80} height={40} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Modals & Toasts */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Feedback
          </h2>
          <Card>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
                <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                  Delete Item
                </Button>
                <Button
                  variant="success"
                  onClick={() => toast.success('Success!', 'Your action was completed.')}
                >
                  Show Success
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toast.error('Error', 'Something went wrong.')}
                >
                  Show Error
                </Button>
                <Tooltip content="This is a helpful tooltip">
                  <Button variant="ghost">Hover me</Button>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Modal Title"
            description="This is a modal description"
          >
            <p className="text-neutral-600">
              This is the modal content. You can put any content here.
            </p>
          </Modal>

          <ConfirmModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => {
              toast.success('Deleted', 'Item has been removed.')
              setConfirmOpen(false)
            }}
            title="Delete Item?"
            message="Are you sure you want to delete this item? This action cannot be undone."
            variant="danger"
            confirmLabel="Delete"
          />
        </section>

        {/* Empty State */}
        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
            Empty States
          </h2>
          <Card>
            <CardContent>
              <EmptyState
                icon={<Package className="w-full h-full" />}
                title="No products yet"
                description="Get started by adding your first product to the catalog."
                action={{
                  label: 'Add Product',
                  onClick: () => toast.info('Action', 'Add product clicked'),
                  icon: <Plus className="w-4 h-4" />,
                }}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
