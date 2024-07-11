import { Module } from '@nestjs/common';
import { PromtService } from './promt.service';

@Module({
  providers: [PromtService],
})
export class PromtModule {}
