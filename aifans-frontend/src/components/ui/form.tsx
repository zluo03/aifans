"use client"

import * as React from "react"
import {
  useForm as useHookForm,
  UseFormReturn,
  SubmitHandler,
  FieldValues,
  UseFormProps,
  FieldPath,
  UseFormRegisterReturn,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: {
  name: TName
  children: React.ReactNode
}) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      {props.children}
    </FormFieldContext.Provider>
  )
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { id } = React.useContext(FormItemContext)

  return (
    <Label
      ref={ref}
      className={cn(className)}
      htmlFor={id}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => {
  const { id } = React.useContext(FormItemContext)

  return <div ref={ref} id={id} {...props} />
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { id } = React.useContext(FormItemContext)

  return (
    <p
      ref={ref}
      id={`${id}-description`}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { id } = React.useContext(FormItemContext)
  const { name } = React.useContext(FormFieldContext)
  
  // 这里我们使用了简单的显示错误消息的逻辑
  // 在实际使用时，你可能需要从form context中获取错误消息

  return (
    <p
      ref={ref}
      id={`${id}-message`}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

interface UseZodFormProps<TSchema extends z.ZodType> {
  schema: TSchema
  defaultValues?: UseFormProps<z.infer<TSchema>>["defaultValues"]
  mode?: UseFormProps<z.infer<TSchema>>["mode"]
}

function useZodForm<TSchema extends z.ZodType>({
  schema,
  defaultValues,
  mode = "onSubmit",
}: UseZodFormProps<TSchema>) {
  return useHookForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  })
}

interface FormProps<TSchema extends z.ZodType, TFieldValues extends FieldValues>
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UseFormReturn<TFieldValues>
  onSubmit: SubmitHandler<TFieldValues>
  className?: string
  children: React.ReactNode
}

function Form<TSchema extends z.ZodType, TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TSchema, TFieldValues>) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={className} {...props}>
      {children}
    </form>
  )
}

export {
  useZodForm,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} 