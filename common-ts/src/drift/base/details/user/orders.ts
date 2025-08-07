import { Order } from '@drift-labs/sdk';
import { Serializer, UISerializableOrder } from 'src/serializableTypes';

export const getOrderDetails = (order: Order): UISerializableOrder => {
	const serializedOrder = Serializer.Serialize.Order(order);
	const deserializedOrder = Serializer.Deserialize.UIOrder(serializedOrder);

	return deserializedOrder;
};
