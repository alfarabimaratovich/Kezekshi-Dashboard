<script setup lang="ts">
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-vue-next'

interface StatsRow {
  id: number
  schoolName: string
  city: string
  totalSystem: {
    grades1to4: number
    grades5to11: number
    totalStudents: number
    staff: number
  }
  visited: {
    grades1to4: number
    grades5to11: number
    staff: number
  }
  meals1to4: {
    received: number
    percentage: number
  }
  meals5to11: {
    received: number
    percentage: number
  }
}

defineProps<{
  statsData: StatsRow[]
  page: number
  perPage: number
  total: number
  paginatedStatsData: StatsRow[]
  totalStats: any
}>()

defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'update:perPage', value: number): void
}>()
</script>

<template>
  <Card>
    <CardContent class="p-0">
      <Table>
        <TableHeader>
          <TableRow class="bg-palette-blue-b/5 hover:bg-palette-blue-b/10">
            <TableHead v-col-resize rowspan="2" class="resizable w-[50px] text-center border-r font-semibold text-palette-blue-a">№</TableHead>
            <TableHead v-col-resize rowspan="2" class="resizable min-w-[200px] border-r font-semibold text-palette-blue-a">Школа</TableHead>
            <TableHead v-col-resize rowspan="2" class="resizable min-w-[120px] border-r font-semibold text-palette-blue-a">Город</TableHead>
            <TableHead v-col-resize colspan="4" class="resizable text-center border-r border-b font-semibold text-palette-blue-a">Всего занесено в систему</TableHead>
            <TableHead v-col-resize colspan="3" class="resizable text-center border-r border-b font-semibold text-palette-blue-a">Посетило на дату</TableHead>
            <TableHead v-col-resize colspan="2" class="resizable text-center border-r border-b font-semibold text-palette-blue-a">Питание 1-4 классы</TableHead>
            <TableHead v-col-resize colspan="2" class="resizable text-center border-b font-semibold text-palette-blue-a">Питание 5-11 классы</TableHead>
          </TableRow>
          <TableRow class="bg-palette-blue-b/5 hover:bg-palette-blue-b/10">
            <!-- Всего занесено -->
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">1-4</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">5-11</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">Всего уч.</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">Персонал</TableHead>
            
            <!-- Посетило -->
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">1-4</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">5-11</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">Персонал</TableHead>

            <!-- Питание 1-4 -->
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">Получили</TableHead>
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">%</TableHead>
            <!-- Питание 5-11 -->
            <TableHead v-col-resize class="resizable text-center border-r text-xs text-muted-foreground">Получили</TableHead>
            <TableHead v-col-resize class="resizable text-center text-xs text-muted-foreground">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="statsData.length === 0">
            <TableCell colspan="14" class="h-24 text-center text-muted-foreground">
              Нет данных
            </TableCell>
          </TableRow>
          <TableRow 
            v-for="(row, index) in paginatedStatsData" 
            :key="row.id" 
            class="transition-all hover:shadow-[0_0_15px_-10px_var(--color-palette-blue-a)] hover:bg-palette-blue-b/5 border-b border-border/40"
            :class="index % 2 === 0 ? 'bg-palette-purple-b/5' : 'bg-background'"
          >
            <TableCell class="text-center border-r font-medium text-muted-foreground">{{ (page - 1) * perPage + index + 1 }}</TableCell>
            <TableCell class="font-medium border-r max-w-[200px]">
              <div class="truncate text-foreground" :title="row.schoolName">
                {{ row.schoolName }}
              </div>
            </TableCell>
            <TableCell class="border-r text-muted-foreground">{{ row.city }}</TableCell>
            
            <TableCell class="text-center border-r">{{ row.totalSystem.grades1to4 }}</TableCell>
            <TableCell class="text-center border-r">{{ row.totalSystem.grades5to11 }}</TableCell>
            <TableCell class="text-center border-r font-medium">{{ row.totalSystem.totalStudents }}</TableCell>
            <TableCell class="text-center border-r text-muted-foreground">{{ row.totalSystem.staff }}</TableCell>

            <TableCell class="text-center border-r text-palette-green-a font-medium">{{ row.visited.grades1to4 }}</TableCell>
            <TableCell class="text-center border-r text-palette-green-a font-medium">{{ row.visited.grades5to11 }}</TableCell>
            <TableCell class="text-center border-r text-muted-foreground">{{ row.visited.staff }}</TableCell>

            <TableCell class="text-center border-r text-palette-purple-a font-medium">{{ row.meals1to4.received }}</TableCell>
            <TableCell class="text-center border-r text-muted-foreground">{{ row.meals1to4.percentage }}%</TableCell>

            <TableCell class="text-center border-r text-palette-purple-a font-medium">{{ row.meals5to11.received }}</TableCell>
            <TableCell class="text-center text-muted-foreground">{{ row.meals5to11.percentage }}%</TableCell>
          </TableRow>
          <!-- Total Row -->
          <TableRow v-if="totalStats" class="bg-palette-yellow/10 font-bold hover:bg-palette-yellow/20">
            <TableCell class="text-center border-r" colspan="3">Итого</TableCell>
            
            <TableCell class="text-center border-r">{{ totalStats.totalSystem.grades1to4 }}</TableCell>
            <TableCell class="text-center border-r">{{ totalStats.totalSystem.grades5to11 }}</TableCell>
            <TableCell class="text-center border-r">{{ totalStats.totalSystem.totalStudents }}</TableCell>
            <TableCell class="text-center border-r">{{ totalStats.totalSystem.staff }}</TableCell>

            <TableCell class="text-center border-r text-palette-green-a">{{ totalStats.visited.grades1to4 }}</TableCell>
            <TableCell class="text-center border-r text-palette-green-a">{{ totalStats.visited.grades5to11 }}</TableCell>
            <TableCell class="text-center border-r">{{ totalStats.visited.staff }}</TableCell>

            <TableCell class="text-center border-r text-palette-purple-a">{{ totalStats.meals1to4.received }}</TableCell>
            <TableCell class="text-center border-r">-</TableCell>

            <TableCell class="text-center border-r text-palette-purple-a">{{ totalStats.meals5to11.received }}</TableCell>
            <TableCell class="text-center">-</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
    <CardFooter class="flex items-center justify-end py-4 gap-4">
      <div class="flex items-center space-x-2">
        <Select
          :model-value="`${perPage}`"
          @update:model-value="(v) => $emit('update:perPage', Number(v))"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="`${perPage}`" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem v-for="pageSize in [10, 20, 30, 40, 50]" :key="pageSize" :value="`${pageSize}`">
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Pagination 
        :page="page" 
        @update:page="(v) => $emit('update:page', v)"
        :total="total" 
        :sibling-count="1" 
        show-edges 
        :items-per-page="perPage"
      >
        <PaginationContent v-slot="{ items }">
          <PaginationFirst>
            <ChevronsLeft class="h-4 w-4" />
          </PaginationFirst>
          <PaginationPrevious>
            <ChevronLeft class="h-4 w-4" />
          </PaginationPrevious>

          <template v-for="(item, index) in items">
            <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" :is-active="item.value === page">
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index" />
          </template>

          <PaginationNext>
            <ChevronRight class="h-4 w-4" />
          </PaginationNext>
          <PaginationLast>
            <ChevronsRight class="h-4 w-4" />
          </PaginationLast>
        </PaginationContent>
      </Pagination>
    </CardFooter>
  </Card>
</template>

<style scoped>
/* небольшой стиль для рукояти, можно положить в global style.css если нужно */
.resizable { position: relative; overflow: hidden; }
/* handle visual (transparent by default) */
.col-resizer-handle { background: transparent; }
/* optional: show thin visual indicator */
.col-resizer-handle::after {
  content: '';
  position: absolute;
  left: 3px;
  top: 10%;
  bottom: 10%;
  width: 1px;
  background: rgba(120,120,120,0.35);
  border-radius: 1px;
}
</style>