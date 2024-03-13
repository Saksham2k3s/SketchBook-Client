import { configureStore } from '@reduxjs/toolkit';
import menuReducer from '@/Slice/menuSlice'
import toolBoxReducer from '@/Slice/toolBoxSlice'
export const store = configureStore({
    reducer : {
       menu : menuReducer,
       toolbox : toolBoxReducer
    }
})