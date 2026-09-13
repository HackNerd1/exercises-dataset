'use client';
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {X} from 'lucide-react';
import {cn} from '@/lib/utils';
export const Drawer=DialogPrimitive.Root;
export const DrawerContent=React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>,React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {closeLabel?:string}>(({className,children,closeLabel='Close',...props},ref)=><DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out"/><DialogPrimitive.Content ref={ref} {...props} className={cn('fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border-t bg-background p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',className)}>{children}<DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 hover:bg-muted"><X className="size-5"/><span className="sr-only">{closeLabel}</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>);
DrawerContent.displayName='DrawerContent';
