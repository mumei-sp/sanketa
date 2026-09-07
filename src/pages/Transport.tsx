import PageHeader from '@/components/layout/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TransportOverview } from '@/features/transport/components/TransportOverview'
import { RoutesTab } from '@/features/transport/components/RoutesTab'
import { VehiclesTab } from '@/features/transport/components/VehiclesTab'
import { DriversTab } from '@/features/transport/components/DriversTab'
import { StudentAssignmentTab } from '@/features/transport/components/StudentAssignmentTab'
import { TransportFeesTab } from '@/features/transport/components/TransportFeesTab'
import { accent, text } from '@/theme/colors'

export default function Transport() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Transport"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Transport' }]}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList
          className="w-full h-9 p-0.5 rounded-lg gap-0.5"
          style={{ backgroundColor: accent.base }}
        >
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'routes', label: 'Routes' },
            { value: 'vehicles', label: 'Vehicles' },
            { value: 'drivers', label: 'Drivers' },
            { value: 'students', label: 'Students' },
            { value: 'fees', label: 'Fees' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 h-full rounded-md text-xs font-medium transition-all duration-200 cursor-pointer data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:opacity-70 data-[state=inactive]:hover:opacity-100"
              style={{ color: text.heading }}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <TransportOverview />
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <RoutesTab />
        </TabsContent>

        <TabsContent value="vehicles" className="mt-4">
          <VehiclesTab />
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <DriversTab />
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <StudentAssignmentTab />
        </TabsContent>

        <TabsContent value="fees" className="mt-4">
          <TransportFeesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
