<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { School, Building } from 'lucide-vue-next'

interface EditForm {
  fullname: string
  phone: string
  iin: string
}

const emit = defineEmits<{
  (e: 'update:isEditing', value: boolean): void
  (e: 'update:editForm', value: EditForm): void
  (e: 'save'): void
  (e: 'cancel'): void
}>()

const updateForm = (field: keyof EditForm, value: string) => {
  emit('update:editForm', { ...props.editForm, [field]: value })
}

const props = defineProps<{
  user: any
  isEditing: boolean
  isSavingProfile: boolean
  editForm: EditForm
  schoolName: string
  regionName: string
}>()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight">Личный кабинет</h2>
    </div>
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Личная информация</CardTitle>
          <CardDescription>Основные данные вашего профиля</CardDescription>
        </div>
        <Button v-if="!isEditing" variant="outline" size="sm" @click="$emit('update:isEditing', true)">
          Изменить
        </Button>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="name">ФИО</Label>
            <Input 
              id="name" 
              :model-value="editForm.fullname"
              @update:model-value="(v) => updateForm('fullname', String(v))"
              :readonly="!isEditing" 
              :class="{'bg-muted': !isEditing}" 
            />
          </div>
          <div class="grid gap-2">
            <Label for="phone">Номер телефона</Label>
            <Input 
              id="phone" 
              :model-value="editForm.phone"
              readonly 
              class="bg-muted opacity-70 cursor-not-allowed" 
            />
          </div>
          <div class="grid gap-2">
            <Label for="iin">ИИН</Label>
            <Input 
              id="iin" 
              :model-value="editForm.iin"
              @update:model-value="(v) => updateForm('iin', String(v))"
              :readonly="!isEditing" 
              :class="{'bg-muted': !isEditing}" 
            />
          </div>
        </div>
      </CardContent>
      <CardFooter v-if="isEditing" class="flex justify-end gap-2">
        <Button variant="outline" @click="$emit('cancel')" :disabled="isSavingProfile">Отмена</Button>
        <Button @click="$emit('save')" :disabled="isSavingProfile">
          {{ isSavingProfile ? 'Сохранение...' : 'Сохранить' }}
        </Button>
      </CardFooter>
    </Card>

    <Card v-if="user?.school_id || user?.region_id">
      <CardHeader>
        <CardTitle>Организация</CardTitle>
        <CardDescription>Информация о месте работы</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2" v-if="user?.school_id">
            <Label>Школа</Label>
            <div class="flex items-center gap-2 p-3 border rounded-md bg-muted/50 h-10">
              <School class="w-4 h-4 text-muted-foreground shrink-0" />
              <span class="truncate" :title="schoolName">{{ schoolName }}</span>
            </div>
          </div>
          <div class="grid gap-2" v-if="user?.region_id">
            <Label>Регион</Label>
            <div class="flex items-center gap-2 p-3 border rounded-md bg-muted/50 h-10">
              <Building class="w-4 h-4 text-muted-foreground shrink-0" />
              <span class="truncate" :title="regionName">{{ regionName }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
