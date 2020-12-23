#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CouplesMoviePickerBackendStack } from '../lib/couples-movie-picker-backend-stack';

const app = new cdk.App();
new CouplesMoviePickerBackendStack(app, 'CouplesMoviePickerBackendStack');
