<script setup lang="ts">
import { Donut } from "@unovis/ts"
import { VisDonut, VisSingleContainer } from "@unovis/vue"
import { TrendingUp } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
  type ChartConfig,
} from "@/components/ui/chart"

const props = defineProps<{
  title: string
  description: string
  data: any[]
  config: ChartConfig
  trendingText?: string
  footerText?: string
}>()
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="items-center pb-0">
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription>{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 pb-0">
      <ChartContainer
        :config="config"
        class="mx-auto aspect-square max-h-[250px]"
      >
        <VisSingleContainer
          :data="data"
          :margin="{ top: 30, bottom: 30 }"
        >
          <VisDonut
            :value="(d: any) => d.visitors"
            :color="(d: any) => config[d.browser as keyof typeof config]?.color"
            :arc-width="0"
          />
          <ChartTooltip
            :triggers="{
              [Donut.selectors.segment]: componentToString(config, ChartTooltipContent, { hideLabel: true })!,
            }"
          />
        </VisSingleContainer>
      </ChartContainer>
    </CardContent>
    <CardFooter class="flex-col gap-2 text-sm">
      <div v-if="trendingText" class="flex items-center gap-2 font-medium leading-none">
        {{ trendingText }} <TrendingUp class="h-4 w-4" />
      </div>
      <div v-if="footerText" class="leading-none text-muted-foreground">
        {{ footerText }}
      </div>
    </CardFooter>
  </Card>
</template>
